package com.smartinventory.controller;

import com.smartinventory.dto.ApiResponse;
import com.smartinventory.dto.PurchaseOrderApproveRequest;
import com.smartinventory.dto.PurchaseOrderCreateRequest;
import com.smartinventory.dto.PurchaseOrderDTO;
import com.smartinventory.dto.PurchaseOrderReceiveRequest;
import com.smartinventory.entity.PurchaseOrderStatus;
import com.smartinventory.service.PurchaseOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/purchase-orders")
@Tag(name = "Purchase Orders", description = "Purchase order management")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final Clock clock;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService, Clock clock) {
        this.purchaseOrderService = purchaseOrderService;
        this.clock = clock;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    @Operation(summary = "List purchase orders")
    public ResponseEntity<ApiResponse<Page<PurchaseOrderDTO>>> getPurchaseOrders(
            @Parameter(description = "Purchase order status")
            @RequestParam(value = "status", required = false) PurchaseOrderStatus status,
            @Parameter(description = "Supplier id")
            @RequestParam(value = "supplierId", required = false) UUID supplierId,
            @Parameter(description = "Warehouse id")
            @RequestParam(value = "warehouseId", required = false) UUID warehouseId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<PurchaseOrderDTO> page = purchaseOrderService.getPurchaseOrders(status, supplierId, warehouseId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Purchase orders retrieved", nowUtc()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    @Operation(summary = "Get purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> getPurchaseOrder(@PathVariable String id) {
        PurchaseOrderDTO purchaseOrder = purchaseOrderService.getPurchaseOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(purchaseOrder, "Purchase order retrieved", nowUtc()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Create purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> createPurchaseOrder(
            @Valid @RequestBody PurchaseOrderCreateRequest request
    ) {
        PurchaseOrderDTO purchaseOrder = purchaseOrderService.createPurchaseOrder(request);
        return ResponseEntity.ok(ApiResponse.success(purchaseOrder, "Purchase order created", nowUtc()));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> approvePurchaseOrder(
            @PathVariable String id,
            @Valid @RequestBody PurchaseOrderApproveRequest request
    ) {
        PurchaseOrderDTO purchaseOrder = purchaseOrderService.approvePurchaseOrder(id, request);
        return ResponseEntity.ok(ApiResponse.success(purchaseOrder, "Purchase order approved", nowUtc()));
    }

    @PutMapping("/{id}/send")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Send purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> sendPurchaseOrder(@PathVariable String id) {
        PurchaseOrderDTO purchaseOrder = purchaseOrderService.markAsSent(id);
        return ResponseEntity.ok(ApiResponse.success(purchaseOrder, "Purchase order sent", nowUtc()));
    }

    @PutMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Receive purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> receivePurchaseOrder(
            @PathVariable String id,
            @Valid @RequestBody PurchaseOrderReceiveRequest request
    ) {
        PurchaseOrderDTO purchaseOrder = purchaseOrderService.receivePurchaseOrder(id, request);
        return ResponseEntity.ok(ApiResponse.success(purchaseOrder, "Purchase order received", nowUtc()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cancel purchase order")
    public ResponseEntity<ApiResponse<Void>> cancelPurchaseOrder(@PathVariable String id) {
        purchaseOrderService.cancelPurchaseOrder(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Purchase order cancelled", nowUtc()));
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
