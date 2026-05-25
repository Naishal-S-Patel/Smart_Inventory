package com.smartinventory.repository;

import com.smartinventory.entity.InventoryTransaction;
import com.smartinventory.entity.InventoryTransactionType;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, UUID> {

    @Query(
            """
            SELECT t
            FROM InventoryTransaction t
                                                WHERE t.warehouse.id = COALESCE(:warehouseId, t.warehouse.id)
                                                        AND t.product.id = COALESCE(:productId, t.product.id)
                                                        AND t.transactionType = COALESCE(:transactionType, t.transactionType)
                                                        AND t.createdAt >= COALESCE(:fromDate, t.createdAt)
                                                        AND t.createdAt <= COALESCE(:toDate, t.createdAt)
            """
    )
    Page<InventoryTransaction> searchTransactions(
            @Param("warehouseId") UUID warehouseId,
            @Param("productId") UUID productId,
            @Param("transactionType") InventoryTransactionType transactionType,
            @Param("fromDate") OffsetDateTime fromDate,
            @Param("toDate") OffsetDateTime toDate,
            Pageable pageable
    );
}
