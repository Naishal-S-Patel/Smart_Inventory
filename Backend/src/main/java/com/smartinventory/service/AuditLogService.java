package com.smartinventory.service;

import com.smartinventory.dto.AuditLogDTO;
import com.smartinventory.entity.AuditLog;
import com.smartinventory.entity.Role;
import com.smartinventory.entity.User;
import com.smartinventory.repository.AuditLogRepository;
import com.smartinventory.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getAllAuditLogs() {
        // Load all users to avoid N+1 queries
        List<User> allUsers = userRepository.findAll();
        Map<String, User> userMap = allUsers.stream()
                .filter(u -> u.getEmail() != null)
                .collect(Collectors.toMap(
                        u -> u.getEmail().toLowerCase(),
                        u -> u,
                        (u1, u2) -> u1
                ));

        // Fetch audit logs sorted by timestamp descending
        List<AuditLog> logs = auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp"));

        return logs.stream()
                .map(log -> toDto(log, userMap))
                .collect(Collectors.toList());
    }

    private AuditLogDTO toDto(AuditLog log, Map<String, User> userMap) {
        String email = log.getUsername();
        String name = email;
        String role = "STAFF";

        if (email != null) {
            User user = userMap.get(email.toLowerCase());
            if (user != null) {
                name = user.getFirstName() + " " + user.getLastName();
                role = user.getRoles().stream()
                        .map(Role::getName)
                        .map(Enum::name)
                        .findFirst()
                        .orElse("STAFF");
            }
        }

        String details = String.format("Performed %s on %s with ID %s", log.getAction(), log.getEntity(), log.getEntityId() != null ? log.getEntityId().toString() : "unknown");

        return AuditLogDTO.builder()
                .id(log.getId())
                .timestamp(log.getTimestamp())
                .userName(name)
                .userRole(role)
                .action(log.getAction())
                .resource(log.getEntity())
                .entityId(log.getEntityId() != null ? log.getEntityId().toString() : null)
                .details(details)
                .ipAddress("127.0.0.1") // Default fallback IP address
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .build();
    }
}
