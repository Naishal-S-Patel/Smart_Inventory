package com.smartinventory.controller;

import com.smartinventory.dto.ApiResponse;
import com.smartinventory.dto.WarehouseDTO;
import com.smartinventory.service.WarehouseService;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/warehouses")
public class WarehouseController {

    private final WarehouseService warehouseService;
    private final Clock clock;

    public WarehouseController(WarehouseService warehouseService, Clock clock) {
        this.warehouseService = warehouseService;
        this.clock = clock;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<Page<WarehouseDTO>>> getWarehouses(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<WarehouseDTO> page = warehouseService.getWarehouses(pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Warehouses retrieved", nowUtc()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<WarehouseDTO>> getWarehouse(@PathVariable UUID id) {
        WarehouseDTO warehouse = warehouseService.getWarehouseById(id);
        return ResponseEntity.ok(ApiResponse.success(warehouse, "Warehouse retrieved", nowUtc()));
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
