package com.smartinventory.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Purchase order line item create request")
public class PurchaseOrderItemCreateRequest {

    @NotNull
    private UUID productId;

    @Min(1)
    private int quantity;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal unitCost;
}
