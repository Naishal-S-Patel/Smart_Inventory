package com.smartinventory.dto;

import com.smartinventory.entity.InventoryTransactionType;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class InventoryTransactionDTO {

    private final UUID id;
    private final UUID productId;
    private final String productName;
    private final String sku;
    private final UUID warehouseId;
    private final String warehouseName;
    private final InventoryTransactionType transactionType;
    private final int quantity;
    private final OffsetDateTime createdAt;
    private final String referenceId;
    private final String referenceType;
    private final String notes;
    private final String createdBy;
}
