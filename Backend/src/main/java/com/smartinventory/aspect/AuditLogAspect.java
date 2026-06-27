package com.smartinventory.aspect;

import com.smartinventory.entity.AuditLog;
import com.smartinventory.repository.AuditLogRepository;
import java.lang.reflect.Method;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
public class AuditLogAspect {

    private final AuditLogRepository auditLogRepository;

    public AuditLogAspect(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @AfterReturning(
            pointcut = "@annotation(auditable)",
            returning = "returnValue"
    )
    public void afterAuditableMethod(JoinPoint joinPoint, Auditable auditable, Object returnValue) {
        try {
            String username = resolveUsername();
            String entityIdStr = resolveEntityId(joinPoint, returnValue);
            UUID entityId = null;
            try {
                if (entityIdStr != null && !"unknown".equals(entityIdStr)) {
                    entityId = UUID.fromString(entityIdStr);
                }
            } catch (IllegalArgumentException ex) {
                // Not a valid UUID, keep it null
            }

            AuditLog log = AuditLog.builder()
                    .entity(auditable.entity())
                    .entityId(entityId)
                    .action(auditable.action())
                    .username(username)
                    .timestamp(OffsetDateTime.now(ZoneOffset.UTC))
                    .build();

            auditLogRepository.save(log);
        } catch (Exception ex) {
            // Never let audit failures break the primary flow
            log.error("Failed to write audit log for {}.{}: {}",
                    auditable.entity(), auditable.action(), ex.getMessage(), ex);
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String resolveUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return "anonymous";
        }
        return auth.getName();
    }

    /**
     * Attempts to resolve the entity ID from the return value first (getId()),
     * then falls back to scanning method parameters for a UUID or String named "id".
     */
    private String resolveEntityId(JoinPoint joinPoint, Object returnValue) {
        // 1. Try getId() on the return value (works for DTOs that expose getId())
        if (returnValue != null) {
            try {
                Method getId = returnValue.getClass().getMethod("getId");
                Object id = getId.invoke(returnValue);
                if (id != null) {
                    return id.toString();
                }
            } catch (Exception ignored) {
                // return value has no getId() — fall through
            }
        }

        // 2. Scan method parameters for a UUID or String arg named "id"
        MethodSignature sig = (MethodSignature) joinPoint.getSignature();
        String[] paramNames = sig.getParameterNames();
        Object[] args = joinPoint.getArgs();
        if (paramNames != null) {
            for (int i = 0; i < paramNames.length; i++) {
                if ("id".equals(paramNames[i]) && args[i] != null) {
                    return args[i].toString();
                }
            }
            // 3. Also accept first UUID-typed arg as entity ID
            for (int i = 0; i < args.length; i++) {
                if (args[i] instanceof UUID uuid) {
                    return uuid.toString();
                }
            }
        }

        return "unknown";
    }
}
