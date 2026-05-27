package com.smartinventory.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Sales order item details")
public class SalesOrderItemDTO {

    private final UUID id;
    private final UUID productId;
    private final ProductDTO product;
    private final int quantity;
    private final BigDecimal unitPrice;
    private final BigDecimal totalPrice;
}
