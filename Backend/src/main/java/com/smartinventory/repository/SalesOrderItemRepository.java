package com.smartinventory.repository;

import com.smartinventory.entity.SalesOrderItem;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalesOrderItemRepository extends JpaRepository<SalesOrderItem, UUID> {
}
