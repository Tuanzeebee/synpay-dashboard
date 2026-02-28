package com.companyx.synpay_dashboard.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.companyx.synpay_dashboard.entity.auth.AuditLog;
import com.companyx.synpay_dashboard.repository.auth.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Writes structured audit log entries to the {@code audit_log} table.
 * <p>
 * This service does NOT declare its own {@code @Transactional} — it is
 * designed to participate in the caller's existing transaction so that
 * audit records are atomically committed (or rolled back) with the
 * business operation.
 */
@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditLogService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Persist a new audit log entry.
     *
     * @param actorAccountId the account performing the action
     * @param action         verb — e.g. CREATE, UPDATE, DELETE, READ
     * @param resource       resource type — e.g. "user", "role"
     * @param resourceId     primary key of the affected resource (nullable)
     * @param oldValue       previous state (nullable)
     * @param newValue       new state (nullable)
     * @param ipAddress      client IP forwarded by the gateway
     * @param userAgent      browser user-agent forwarded by the gateway
     */
    public void log(Integer actorAccountId,
                    String action,
                    String resource,
                    String resourceId,
                    Object oldValue,
                    Object newValue,
                    String ipAddress,
                    String userAgent) {

        AuditLog entry = new AuditLog();
        entry.setActorAccountId(actorAccountId);
        entry.setAction(action);
        entry.setResource(resource);
        entry.setResourceId(resourceId);
        entry.setOldValue(toJson(oldValue));
        entry.setNewValue(toJson(newValue));
        entry.setIpAddress(ipAddress);
        entry.setUserAgent(userAgent);

        auditLogRepository.save(entry);
        log.info("Audit: account={} action={} resource={} resourceId={}",
                actorAccountId, action, resource, resourceId);
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            log.warn("Failed to serialize audit value: {}", e.getMessage());
            return obj.toString();
        }
    }
}
