# Performance Optimizations — Day 7 Sprint

## Overview

This document records JPA/Hibernate performance improvements applied during the Day 7 combined sprint.

---

## 1. `InventoryRepository` — Eliminated N+1 on Product & Warehouse Name Lookups

**Problem:** The `searchInventory` paginated query and `findByProductIdAndWarehouseId` both returned
`Inventory` objects with lazily-loaded `product` and `warehouse` associations. Each call to
`inventory.getProduct().getName()` or `inventory.getWarehouse().getName()` inside the mapper
triggered a separate `SELECT` — one per row in the page. For a 20-row page this is 40 extra round
trips to the database.

**Fix:** Added `@EntityGraph(attributePaths = {"product", "warehouse"})` to both repository methods.
This tells Hibernate to use a single `LEFT OUTER JOIN` fetch instead of lazy selects.

```java
@EntityGraph(attributePaths = {"product", "warehouse"})
Optional<Inventory> findByProductIdAndWarehouseId(UUID productId, UUID warehouseId);

@EntityGraph(attributePaths = {"product", "warehouse"})
@Query("SELECT i FROM Inventory i JOIN i.product p JOIN i.warehouse w ...")
Page<Inventory> searchInventory(...);
```

**Expected impact:** Reduces DB round trips from `O(2n + 1)` to `O(1)` per page request.

---

## 2. Hibernate Statistics & Slow Query Logging

**Added to `application.yml`:**

```yaml
spring:
  jpa:
    properties:
      hibernate:
        generate_statistics: true
        session:
          events:
            log:
              LOG_QUERIES_SLOWER_THAN_MS: 25
```

- `generate_statistics: true` — Hibernate logs statement counts, entity load counts, and L2C hit
  ratios at session close. Look for `HHH90000` lines in the log.
- `LOG_QUERIES_SLOWER_THAN_MS: 25` — Any JDBC query that takes longer than 25 ms is logged at
  `INFO` level, letting you identify slow queries in development without a profiler.

---

## 3. Recommendations for Future Work

| Area | Recommendation |
|------|---------------|
| `PurchaseOrderRepository.findById` | Add `JOIN FETCH items, items.product, supplier, warehouse` via `@Query` or named `@EntityGraph` to avoid N+1 on order detail view |
| `InventoryTransactionRepository` | Add `@EntityGraph(attributePaths = {"product", "warehouse"})` for batch-read endpoints (e.g., analytics exports) |
| Second-Level Cache | Enable Hibernate L2C (e.g., Caffeine via `spring-boot-starter-cache`) for read-heavy `Product` and `Warehouse` lookups — these rarely change |
| Connection Pool | Tune HikariCP `maximumPoolSize` based on Hibernate statistics output under load |
| Pagination defaults | Keep page sizes ≤ 50 for queries that join large association sets; large pages negate `@EntityGraph` gains |
