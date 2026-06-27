package com.smartinventory.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.smartinventory.entity.Inventory;
import com.smartinventory.entity.InventoryId;

public interface InventoryRepository extends JpaRepository<Inventory, InventoryId> {

    @EntityGraph(attributePaths = {"product", "warehouse"})
    @Query("SELECT i FROM Inventory i WHERE i.product.id = :productId AND i.warehouse.id = :warehouseId")
    Optional<Inventory> findByProductIdAndWarehouseId(@Param("productId") UUID productId, @Param("warehouseId") UUID warehouseId);

    @EntityGraph(attributePaths = {"product", "warehouse"})
    @Query("""
            SELECT i FROM Inventory i
            JOIN i.product p
            JOIN i.warehouse w
            WHERE (:warehouseId IS NULL OR w.id = :warehouseId)
              AND (:productId IS NULL OR p.id = :productId)
              AND (:lowStockOnly = false OR (i.quantityOnHand - i.reservedQuantity) <= p.reorderPoint)
            """)
    Page<Inventory> searchInventory(
            @Param("warehouseId") UUID warehouseId,
            @Param("productId") UUID productId,
            @Param("lowStockOnly") boolean lowStockOnly,
            Pageable pageable
    );
}
