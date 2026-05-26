package com.smartinventory.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Purchase order line item receive request")
public class PurchaseOrderItemReceiveRequest {

    @NotNull
    private UUID productId;

    @Min(0)
    private int receivedQuantity;
}
