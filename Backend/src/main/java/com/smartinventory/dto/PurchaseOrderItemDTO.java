package com.smartinventory.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "Purchase order line item")
public class PurchaseOrderItemDTO {

    private final UUID id;
    private final UUID productId;
    private final ProductDTO product;
    private final int quantity;
    private final BigDecimal unitCost;
    private final BigDecimal totalCost;
    private final int receivedQuantity;
}
