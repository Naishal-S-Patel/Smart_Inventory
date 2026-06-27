package com.smartinventory.websocket;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class InventoryEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public InventoryEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishInventoryUpdate(UUID warehouseId, UUID productId,
                                       int oldQty, int newQty, String eventType) {
        InventoryEventPayload payload = InventoryEventPayload.builder()
                .eventType(eventType)
                .warehouseId(warehouseId)
                .productId(productId)
                .oldQuantity(oldQty)
                .newQuantity(newQty)
                .timestamp(OffsetDateTime.now(ZoneOffset.UTC))
                .build();

        String destination = "/topic/inventory/" + warehouseId;
        messagingTemplate.convertAndSend(destination, payload);
        log.debug("Published inventory event to {}: type={}, product={}, {} -> {}",
                destination, eventType, productId, oldQty, newQty);
    }
}
