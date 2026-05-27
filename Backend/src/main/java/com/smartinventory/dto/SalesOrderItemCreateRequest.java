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
@Schema(description = "Sales order item create request")
public class SalesOrderItemCreateRequest {

    @NotNull
    private UUID productId;

    @NotNull
    @Min(1)
    private Integer quantity;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal unitPrice;
}
