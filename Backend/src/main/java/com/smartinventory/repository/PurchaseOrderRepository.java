package com.smartinventory.repository;

import com.smartinventory.entity.PurchaseOrder;
import com.smartinventory.entity.PurchaseOrderStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {

        Optional<PurchaseOrder> findByOrderNumberIgnoreCase(String orderNumber);

    @Query(
            """
            SELECT po
            FROM PurchaseOrder po
            WHERE (:status IS NULL OR po.status = :status)
              AND (:supplierId IS NULL OR po.supplier.id = :supplierId)
              AND (:warehouseId IS NULL OR po.warehouse.id = :warehouseId)
            """
    )
    Page<PurchaseOrder> searchPurchaseOrders(
            @Param("status") PurchaseOrderStatus status,
            @Param("supplierId") UUID supplierId,
            @Param("warehouseId") UUID warehouseId,
            Pageable pageable
    );
}
