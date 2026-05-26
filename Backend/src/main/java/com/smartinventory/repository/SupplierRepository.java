package com.smartinventory.repository;

import com.smartinventory.entity.Supplier;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    Optional<Supplier> findByIdAndIsActiveTrue(UUID id);

    Page<Supplier> findByIsActiveTrue(Pageable pageable);

    boolean existsBySupplierCodeIgnoreCase(String supplierCode);
}
