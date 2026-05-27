package com.smartinventory.repository;

import com.smartinventory.entity.PaymentMethod;
import com.smartinventory.entity.PaymentStatus;
import com.smartinventory.entity.SalesOrder;
import com.smartinventory.entity.SalesOrderStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, UUID> {

    Optional<SalesOrder> findByOrderNumberIgnoreCase(String orderNumber);

    @Query(
            """
            SELECT so
            FROM SalesOrder so
            WHERE (:status IS NULL OR so.status = :status)
              AND (:customerId IS NULL OR so.customer.id = :customerId)
              AND (:warehouseId IS NULL OR so.warehouse.id = :warehouseId)
              AND (:paymentStatus IS NULL OR so.paymentStatus = :paymentStatus)
              AND (:paymentMethod IS NULL OR so.paymentMethod = :paymentMethod)
            """
    )
    Page<SalesOrder> searchSalesOrders(
            @Param("status") SalesOrderStatus status,
            @Param("customerId") UUID customerId,
            @Param("warehouseId") UUID warehouseId,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("paymentMethod") PaymentMethod paymentMethod,
            Pageable pageable
    );
}
