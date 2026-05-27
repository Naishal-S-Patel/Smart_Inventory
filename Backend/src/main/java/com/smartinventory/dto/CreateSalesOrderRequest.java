package com.smartinventory.dto;

import com.smartinventory.entity.PaymentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
@Schema(description = "Sales order create request")
public class CreateSalesOrderRequest {

    @NotNull
    private UUID customerId;

    @NotNull
    private UUID warehouseId;

    @NotNull
    private PaymentMethod paymentMethod;

    @Size(max = 2000)
    private String notes;

    @Valid
    @NotEmpty
    private List<SalesOrderItemCreateRequest> items;
}
