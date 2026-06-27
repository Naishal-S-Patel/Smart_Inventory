package com.smartinventory.controller;

import com.smartinventory.dto.ApiResponse;
import com.smartinventory.dto.AuditLogDTO;
import com.smartinventory.service.AuditLogService;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final Clock clock;

    public AuditLogController(AuditLogService auditLogService, Clock clock) {
        this.auditLogService = auditLogService;
        this.clock = clock;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLogDTO>>> getAuditLogs() {
        List<AuditLogDTO> logs = auditLogService.getAllAuditLogs();
        return ResponseEntity.ok(ApiResponse.success(logs, "Audit logs retrieved successfully", nowUtc()));
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
