package com.smartinventory.websocket;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryEventPayload {
    private String eventType;
    private UUID warehouseId;
    private UUID productId;
    private int oldQuantity;
    private int newQuantity;
    private OffsetDateTime timestamp;
}
