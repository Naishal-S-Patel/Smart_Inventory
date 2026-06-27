package com.smartinventory.websocket;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AlertEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public AlertEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishAlert(UUID userId, UUID alertId, String severity, String message) {
        AlertEventPayload payload = AlertEventPayload.builder()
                .alertId(alertId)
                .severity(severity)
                .message(message)
                .timestamp(OffsetDateTime.now(ZoneOffset.UTC))
                .build();

        String destination = "/topic/alerts/" + userId;
        messagingTemplate.convertAndSend(destination, payload);
        log.warn("Published {} alert to {}: {}", severity, destination, message);
    }
}
