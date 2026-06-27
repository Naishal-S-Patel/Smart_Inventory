package com.smartinventory.dto;

import com.smartinventory.entity.PaymentMethod;
import com.smartinventory.entity.PaymentStatus;
import com.smartinventory.entity.SalesOrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "Sales order details")
public class SalesOrderDTO {

    private final UUID id;
    private final String orderNumber;
    private final UUID customerId;
    private final CustomerDTO customer;
    private final UUID warehouseId;
    private final WarehouseDTO warehouse;
    private final SalesOrderStatus status;
    private final BigDecimal totalAmount;
    private final PaymentMethod paymentMethod;
    private final PaymentStatus paymentStatus;
    private final String notes;
    private final UUID createdBy;
    private final OffsetDateTime createdAt;
    private final OffsetDateTime updatedAt;
    private final List<SalesOrderItemDTO> items;
}
