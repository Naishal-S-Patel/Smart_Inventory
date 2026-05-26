package com.smartinventory.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Purchase order create request")
public class PurchaseOrderCreateRequest {

    @NotNull
    private UUID supplierId;

    @NotNull
    private UUID warehouseId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expectedDeliveryDate;

    @Size(max = 2000)
    private String notes;

    @Valid
    @NotEmpty
    private List<PurchaseOrderItemCreateRequest> items;
}
