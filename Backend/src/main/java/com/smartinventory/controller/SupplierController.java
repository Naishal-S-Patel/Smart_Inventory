package com.smartinventory.controller;

import com.smartinventory.dto.ApiResponse;
import com.smartinventory.dto.SupplierCreateRequest;
import com.smartinventory.dto.SupplierDTO;
import com.smartinventory.dto.SupplierUpdateRequest;
import com.smartinventory.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/suppliers")
@Tag(name = "Suppliers", description = "Supplier management")
public class SupplierController {

    private final SupplierService supplierService;
    private final Clock clock;

    public SupplierController(SupplierService supplierService, Clock clock) {
        this.supplierService = supplierService;
        this.clock = clock;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    @Operation(summary = "List suppliers")
    public ResponseEntity<ApiResponse<Page<SupplierDTO>>> getSuppliers(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<SupplierDTO> page = supplierService.getSuppliers(pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Suppliers retrieved", nowUtc()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Create supplier")
    public ResponseEntity<ApiResponse<SupplierDTO>> createSupplier(
            @Valid @RequestBody SupplierCreateRequest request
    ) {
        SupplierDTO supplier = supplierService.createSupplier(request);
        return ResponseEntity.ok(ApiResponse.success(supplier, "Supplier created", nowUtc()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Update supplier")
    public ResponseEntity<ApiResponse<SupplierDTO>> updateSupplier(
            @PathVariable UUID id,
            @Valid @RequestBody SupplierUpdateRequest request
    ) {
        SupplierDTO supplier = supplierService.updateSupplier(id, request);
        return ResponseEntity.ok(ApiResponse.success(supplier, "Supplier updated", nowUtc()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Deactivate supplier")
    public ResponseEntity<ApiResponse<Void>> deleteSupplier(@PathVariable UUID id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Supplier deactivated", nowUtc()));
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
