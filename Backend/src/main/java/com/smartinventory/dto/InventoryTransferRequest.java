package com.smartinventory.dto;

import jakarta.validation.constraints.Min;
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
public class InventoryTransferRequest {

    @NotNull
    private UUID productId;

    @NotNull
    private UUID fromWarehouseId;

    @NotNull
    private UUID toWarehouseId;

    @NotNull
    @Min(1)
    private Integer quantity;

    @Size(max = 128)
    private String referenceId;

    @Size(max = 64)
    private String referenceType;

    @Size(max = 2000)
    private String notes;
}
