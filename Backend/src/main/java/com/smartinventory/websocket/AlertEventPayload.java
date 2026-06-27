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
public class AlertEventPayload {
    private UUID alertId;
    private String severity;
    private String message;
    private OffsetDateTime timestamp;
}
