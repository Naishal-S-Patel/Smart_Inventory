package com.smartinventory.dto;

import com.smartinventory.entity.InventoryTransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAdjustmentRequest {

    @NotNull
    private UUID productId;

    @NotNull
    private UUID warehouseId;

    @NotNull
    private Integer quantity;

    @NotNull
    private InventoryTransactionType transactionType;

    @Size(max = 128)
    private String referenceId;

    @Size(max = 64)
    private String referenceType;

    @Size(max = 2000)
    private String notes;
}
