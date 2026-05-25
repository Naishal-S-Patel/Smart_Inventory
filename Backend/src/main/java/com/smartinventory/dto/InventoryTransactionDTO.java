package com.smartinventory.dto;

import com.smartinventory.entity.InventoryTransactionType;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InventoryTransactionDTO {

    private final UUID id;
    private final UUID productId;
    private final UUID warehouseId;
    private final InventoryTransactionType transactionType;
    private final int quantity;
    private final OffsetDateTime createdAt;
}
