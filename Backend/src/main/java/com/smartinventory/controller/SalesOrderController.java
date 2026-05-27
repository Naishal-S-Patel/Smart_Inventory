package com.smartinventory.controller;

import com.smartinventory.dto.ApiResponse;
import com.smartinventory.dto.CreateSalesOrderRequest;
import com.smartinventory.dto.SalesOrderDTO;
import com.smartinventory.entity.PaymentMethod;
import com.smartinventory.entity.PaymentStatus;
import com.smartinventory.entity.SalesOrderStatus;
import com.smartinventory.service.SalesOrderService;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/sales-orders")
@Tag(name = "Sales Orders", description = "Sales order management")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;
    private final Clock clock;

    public SalesOrderController(SalesOrderService salesOrderService, Clock clock) {
        this.salesOrderService = salesOrderService;
        this.clock = clock;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    @Operation(summary = "List sales orders")
    public ResponseEntity<ApiResponse<Page<SalesOrderDTO>>> getSalesOrders(
            @Parameter(description = "Sales order status")
            @RequestParam(value = "status", required = false) SalesOrderStatus status,
            @Parameter(description = "Customer id")
            @RequestParam(value = "customerId", required = false) UUID customerId,
            @Parameter(description = "Warehouse id")
            @RequestParam(value = "warehouseId", required = false) UUID warehouseId,
            @Parameter(description = "Payment status")
            @RequestParam(value = "paymentStatus", required = false) PaymentStatus paymentStatus,
            @Parameter(description = "Payment method")
            @RequestParam(value = "paymentMethod", required = false) PaymentMethod paymentMethod,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<SalesOrderDTO> page = salesOrderService.getSalesOrders(status, customerId, warehouseId,
                paymentStatus, paymentMethod, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Sales orders retrieved", nowUtc()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    @Operation(summary = "Get sales order")
    public ResponseEntity<ApiResponse<SalesOrderDTO>> getSalesOrder(@PathVariable UUID id) {
        SalesOrderDTO salesOrder = salesOrderService.getSalesOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(salesOrder, "Sales order retrieved", nowUtc()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    @Operation(summary = "Create sales order")
    public ResponseEntity<ApiResponse<SalesOrderDTO>> createSalesOrder(
            @Valid @RequestBody CreateSalesOrderRequest request
    ) {
        SalesOrderDTO salesOrder = salesOrderService.createOrder(request);
        return ResponseEntity.ok(ApiResponse.success(salesOrder, "Sales order created", nowUtc()));
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Confirm sales order")
    public ResponseEntity<ApiResponse<SalesOrderDTO>> confirmSalesOrder(@PathVariable UUID id) {
        SalesOrderDTO salesOrder = salesOrderService.confirmOrder(id);
        return ResponseEntity.ok(ApiResponse.success(salesOrder, "Sales order confirmed", nowUtc()));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Complete sales order")
    public ResponseEntity<ApiResponse<SalesOrderDTO>> completeSalesOrder(@PathVariable UUID id) {
        SalesOrderDTO salesOrder = salesOrderService.completeOrder(id);
        return ResponseEntity.ok(ApiResponse.success(salesOrder, "Sales order completed", nowUtc()));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Cancel sales order")
    public ResponseEntity<ApiResponse<SalesOrderDTO>> cancelSalesOrder(@PathVariable UUID id) {
        SalesOrderDTO salesOrder = salesOrderService.cancelOrder(id);
        return ResponseEntity.ok(ApiResponse.success(salesOrder, "Sales order cancelled", nowUtc()));
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
