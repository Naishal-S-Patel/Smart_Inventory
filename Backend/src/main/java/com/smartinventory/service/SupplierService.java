package com.smartinventory.service;

import com.smartinventory.dto.SupplierCreateRequest;
import com.smartinventory.dto.SupplierDTO;
import com.smartinventory.dto.SupplierUpdateRequest;
import com.smartinventory.entity.Supplier;
import com.smartinventory.exception.SupplierNotFoundException;
import com.smartinventory.mapper.PurchaseOrderMapper;
import com.smartinventory.repository.SupplierRepository;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final PurchaseOrderMapper purchaseOrderMapper;
    private final Clock clock;

    public SupplierService(SupplierRepository supplierRepository, PurchaseOrderMapper purchaseOrderMapper, Clock clock) {
        this.supplierRepository = supplierRepository;
        this.purchaseOrderMapper = purchaseOrderMapper;
        this.clock = clock;
    }

    @Transactional
    public SupplierDTO createSupplier(SupplierCreateRequest request) {
        if (supplierRepository.existsBySupplierCodeIgnoreCase(request.getSupplierCode())) {
            throw new IllegalArgumentException("Supplier code already exists: " + request.getSupplierCode());
        }

        OffsetDateTime now = nowUtc();
        Supplier supplier = new Supplier();
        supplier.setSupplierCode(request.getSupplierCode().trim());
        supplier.setCompanyName(request.getCompanyName().trim());
        supplier.setContactPerson(trimOrNull(request.getContactPerson()));
        supplier.setEmail(trimOrNull(request.getEmail()));
        supplier.setPhone(trimOrNull(request.getPhone()));
        supplier.setAddress(trimOrNull(request.getAddress()));
        supplier.setCity(trimOrNull(request.getCity()));
        supplier.setState(trimOrNull(request.getState()));
        supplier.setCountry(trimOrNull(request.getCountry()));
        supplier.setAvgLeadDays(request.getAvgLeadDays());
        supplier.setActive(true);
        supplier.setCreatedAt(now);
        supplier.setUpdatedAt(now);

        Supplier saved = supplierRepository.save(supplier);
        log.info("Supplier created: {}", saved.getSupplierCode());
        return purchaseOrderMapper.toSupplierDto(saved);
    }

    @Transactional
    public SupplierDTO updateSupplier(UUID id, SupplierUpdateRequest request) {
        Supplier supplier = supplierRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new SupplierNotFoundException(id));

        if (request.getSupplierCode() != null
                && !request.getSupplierCode().equalsIgnoreCase(supplier.getSupplierCode())) {
            if (supplierRepository.existsBySupplierCodeIgnoreCase(request.getSupplierCode())) {
                throw new IllegalArgumentException("Supplier code already exists: " + request.getSupplierCode());
            }
            supplier.setSupplierCode(request.getSupplierCode().trim());
        }

        if (request.getCompanyName() != null) {
            supplier.setCompanyName(request.getCompanyName().trim());
        }

        if (request.getContactPerson() != null) {
            supplier.setContactPerson(trimOrNull(request.getContactPerson()));
        }

        if (request.getEmail() != null) {
            supplier.setEmail(trimOrNull(request.getEmail()));
        }

        if (request.getPhone() != null) {
            supplier.setPhone(trimOrNull(request.getPhone()));
        }

        if (request.getAddress() != null) {
            supplier.setAddress(trimOrNull(request.getAddress()));
        }

        if (request.getCity() != null) {
            supplier.setCity(trimOrNull(request.getCity()));
        }

        if (request.getState() != null) {
            supplier.setState(trimOrNull(request.getState()));
        }

        if (request.getCountry() != null) {
            supplier.setCountry(trimOrNull(request.getCountry()));
        }

        if (request.getAvgLeadDays() != null) {
            supplier.setAvgLeadDays(request.getAvgLeadDays());
        }

        if (request.getIsActive() != null) {
            supplier.setActive(request.getIsActive());
        }

        supplier.setUpdatedAt(nowUtc());
        Supplier saved = supplierRepository.save(supplier);
        log.info("Supplier updated: {}", saved.getSupplierCode());
        return purchaseOrderMapper.toSupplierDto(saved);
    }

    @Transactional
    public void deleteSupplier(UUID id) {
        Supplier supplier = supplierRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new SupplierNotFoundException(id));
        supplier.setActive(false);
        supplier.setUpdatedAt(nowUtc());
        supplierRepository.save(supplier);
        log.info("Supplier deactivated: {}", supplier.getSupplierCode());
    }

    @Transactional(readOnly = true)
    public SupplierDTO getSupplierById(UUID id) {
        Supplier supplier = supplierRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new SupplierNotFoundException(id));
        return purchaseOrderMapper.toSupplierDto(supplier);
    }

    @Transactional(readOnly = true)
    public Page<SupplierDTO> getSuppliers(Pageable pageable) {
        return supplierRepository.findByIsActiveTrue(pageable)
                .map(purchaseOrderMapper::toSupplierDto);
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
