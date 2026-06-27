package com.smartinventory.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AuditLogDTO {
    private final UUID id;
    private final OffsetDateTime timestamp;
    private final String userName;
    private final String userRole;
    private final String action;
    private final String resource;
    private final String entityId;
    private final String details;
    private final String ipAddress;
    private final String oldValue;
    private final String newValue;
}
