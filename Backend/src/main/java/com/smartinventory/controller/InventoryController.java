package com.smartinventory.controller;

import com.smartinventory.dto.ApiResponse;
import com.smartinventory.dto.InventoryAdjustmentRequest;
import com.smartinventory.dto.InventoryDTO;
import com.smartinventory.dto.InventoryTransactionDTO;
import com.smartinventory.dto.InventoryTransferRequest;
import com.smartinventory.entity.InventoryTransactionType;
import com.smartinventory.service.InventoryService;
import jakarta.validation.Valid;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryService inventoryService;
    private final Clock clock;

    public InventoryController(InventoryService inventoryService, Clock clock) {
        this.inventoryService = inventoryService;
        this.clock = clock;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<Page<InventoryDTO>>> getInventory(
            @RequestParam(value = "warehouseId", required = false) UUID warehouseId,
            @RequestParam(value = "productId", required = false) UUID productId,
            @RequestParam(value = "lowStockOnly", defaultValue = "false") boolean lowStockOnly,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<InventoryDTO> page = inventoryService.getInventory(warehouseId, productId, lowStockOnly, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Inventory retrieved", nowUtc()));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<Page<InventoryDTO>>> getLowStock(
            @RequestParam(value = "warehouseId", required = false) UUID warehouseId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<InventoryDTO> page = inventoryService.getLowStockProducts(warehouseId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Low stock inventory retrieved", nowUtc()));
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<Page<InventoryTransactionDTO>>> getTransactions(
            @RequestParam(value = "warehouseId", required = false) UUID warehouseId,
            @RequestParam(value = "productId", required = false) UUID productId,
            @RequestParam(value = "transactionType", required = false) InventoryTransactionType transactionType,
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime fromDate,
            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime toDate,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<InventoryTransactionDTO> page = inventoryService.getTransactions(
                warehouseId, productId, transactionType, fromDate, toDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Inventory transactions retrieved", nowUtc()));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<InventoryDTO>> adjustStock(
            @Valid @RequestBody InventoryAdjustmentRequest request
    ) {
        InventoryDTO updated = inventoryService.adjustStock(request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Inventory adjusted", nowUtc()));
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<List<InventoryDTO>>> transferStock(
            @Valid @RequestBody InventoryTransferRequest request
    ) {
        List<InventoryDTO> result = inventoryService.transferStock(request);
        return ResponseEntity.ok(ApiResponse.success(result, "Inventory transferred", nowUtc()));
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
