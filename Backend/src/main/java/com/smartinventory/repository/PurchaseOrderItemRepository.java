package com.smartinventory.repository;

import com.smartinventory.entity.PurchaseOrderItem;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, UUID> {
}
