package com.smartinventory.dto;

import com.smartinventory.entity.PurchaseOrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "Purchase order details")
public class PurchaseOrderDTO {

    private final UUID id;
    private final String orderNumber;
    private final UUID supplierId;
    private final SupplierDTO supplier;
    private final UUID warehouseId;
    private final WarehouseDTO warehouse;
    private final PurchaseOrderStatus status;
    private final BigDecimal totalAmount;
    private final OffsetDateTime expectedDeliveryDate;
    private final OffsetDateTime actualDeliveryDate;
    private final UUID createdBy;
    private final UUID approvedBy;
    private final String notes;
    private final OffsetDateTime createdAt;
    private final OffsetDateTime updatedAt;
    private final List<PurchaseOrderItemDTO> items;
}
