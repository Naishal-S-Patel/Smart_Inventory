package com.smartinventory.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class InventoryDTO {

    private final UUID productId;
    private final UUID warehouseId;
    private final ProductDTO product;
    private final WarehouseDTO warehouse;
    private final int quantityOnHand;
    private final int reservedQuantity;
    private final int availableQuantity;
    private final OffsetDateTime lastUpdatedAt;
}
