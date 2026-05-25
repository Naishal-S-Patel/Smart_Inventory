package com.smartinventory.repository;

import com.smartinventory.entity.Warehouse;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<Warehouse, UUID> {

    Optional<Warehouse> findByIdAndIsActiveTrue(UUID id);

    Page<Warehouse> findByIsActiveTrue(Pageable pageable);

    boolean existsByCodeIgnoreCase(String code);
}
