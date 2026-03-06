package com.companyx.synpay_dashboard.service;

import java.io.StringWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.dto.response.AuditLogPageResponse;
import com.companyx.synpay_dashboard.dto.response.AuditLogResponse;
import com.companyx.synpay_dashboard.entity.auth.AuditLog;
import com.companyx.synpay_dashboard.repository.auth.AuditLogRepository;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.criteria.Predicate;

/**
 * Service for writing and querying immutable audit log entries.
 * <p>
 * The {@link #log} method participates in the caller's existing
 * transaction so records are atomically committed (or rolled back) with
 * the business operation. It auto-resolves {@code actor_email} and
 * {@code actor_role} from the Spring Security context when available.
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

    // ===================================================================
    //  Write
    // ===================================================================

    /**
     * Persist a new audit log entry.
     * <p>
     * <strong>Backward-compatible</strong> — the 8-parameter signature
     * used by all 19 existing callers is preserved. Actor email / role
     * are automatically resolved from the JWT principal stored in the
     * Spring Security context; if no principal is available (e.g.
     * login-failure paths), those fields are left {@code null}.
     *
     * @param actorAccountId the account performing the action
     * @param action         verb — e.g. USER_CREATE, LOGIN_SUCCESS
     * @param resource       target resource type — e.g. "user", "role"
     * @param resourceId     primary key of the affected resource (nullable)
     * @param oldValue       previous state (nullable, serialised to JSON)
     * @param newValue       new state (nullable, serialised to JSON)
     * @param ipAddress      client IP forwarded by the gateway
     * @param userAgent      browser user-agent forwarded by the gateway
     */
    @Transactional(transactionManager = "authTransactionManager", propagation = Propagation.REQUIRES_NEW)
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

        // Auto-resolve actor info from the authenticated JWT principal
        resolveActorInfo(entry);

        // Auto-generate a human-readable description
        entry.setActionDescription(buildDescription(action, resource, resourceId));

        auditLogRepository.save(entry);
        log.info("Audit: account={} action={} resource={} resourceId={}",
                actorAccountId, action, resource, resourceId);
    }

    // ===================================================================
    //  Read — paginated list
    // ===================================================================

    /**
     * Returns a paginated, filtered list of audit log entries sorted by
     * {@code created_at DESC}.
     */
    public AuditLogPageResponse findAll(String actorEmail,
                                        String action,
                                        String resource,
                                        LocalDateTime dateFrom,
                                        LocalDateTime dateTo,
                                        int page,
                                        int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<AuditLog> spec = buildSpec(actorEmail, action, resource, dateFrom, dateTo);

        Page<AuditLog> result = auditLogRepository.findAll(spec, pageable);

        List<AuditLogResponse> content = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new AuditLogPageResponse(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    // ===================================================================
    //  Read — single entry
    // ===================================================================

    /**
     * Fetches a single audit log by its ID.
     *
     * @return the response DTO, or {@code null} if not found
     */
    public AuditLogResponse findById(Long id) {
        return auditLogRepository.findById(id)
                .map(this::toResponse)
                .orElse(null);
    }

    // ===================================================================
    //  Export — CSV
    // ===================================================================

    /**
     * Exports filtered audit log entries as a CSV string.
     */
    public String exportCsv(String actorEmail,
                            String action,
                            String resource,
                            LocalDateTime dateFrom,
                            LocalDateTime dateTo) {

        Specification<AuditLog> spec = buildSpec(actorEmail, action, resource, dateFrom, dateTo);
        List<AuditLog> entries = auditLogRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));

        StringWriter writer = new StringWriter();
        // CSV header
        writer.append("ID,Actor Account ID,Actor Email,Actor Role,Action,Resource,Resource ID,Description,IP Address,User Agent,Created At\n");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (AuditLog e : entries) {
            writer.append(String.valueOf(e.getAuditId())).append(',');
            writer.append(String.valueOf(e.getActorAccountId())).append(',');
            writer.append(csvEscape(e.getActorEmail())).append(',');
            writer.append(csvEscape(e.getActorRole())).append(',');
            writer.append(csvEscape(e.getAction())).append(',');
            writer.append(csvEscape(e.getResource())).append(',');
            writer.append(csvEscape(e.getResourceId())).append(',');
            writer.append(csvEscape(e.getActionDescription())).append(',');
            writer.append(csvEscape(e.getIpAddress())).append(',');
            writer.append(csvEscape(e.getUserAgent())).append(',');
            writer.append(e.getCreatedAt() != null ? e.getCreatedAt().format(dtf) : "");
            writer.append('\n');
        }
        return writer.toString();
    }

    // ===================================================================
    //  Private helpers
    // ===================================================================

    /**
     * Attempts to pull the email and role from the current request's
     * JWT principal.  Safely swallows any failure (e.g. unauthenticated
     * contexts such as LOGIN_FAILED).
     */
    private void resolveActorInfo(AuditLog entry) {
        try {
            GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
            entry.setActorEmail(principal.getEmail());
            entry.setActorRole(principal.getRole());
        } catch (Exception ignored) {
            // Login / logout / unauthenticated paths — actor info unavailable
        }
    }

    /**
     * Generates a human-readable action description.
     * Example: "USER_CREATE on user #42"
     */
    private String buildDescription(String action, String resource, String resourceId) {
        StringBuilder sb = new StringBuilder();
        sb.append(action != null ? action : "UNKNOWN");
        if (resource != null) {
            sb.append(" on ").append(resource);
        }
        if (resourceId != null) {
            sb.append(" #").append(resourceId);
        }
        return sb.toString();
    }

    /**
     * Builds a dynamic JPA {@link Specification} from optional filter
     * parameters.
     */
    private Specification<AuditLog> buildSpec(String actorEmail,
                                              String action,
                                              String resource,
                                              LocalDateTime dateFrom,
                                              LocalDateTime dateTo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (actorEmail != null && !actorEmail.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("actorEmail")),
                        "%" + actorEmail.toLowerCase() + "%"));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (resource != null && !resource.isBlank()) {
                predicates.add(cb.equal(root.get("resource"), resource));
            }
            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateFrom));
            }
            if (dateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), dateTo));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Maps an entity to the API response DTO.
     */
    private AuditLogResponse toResponse(AuditLog entity) {
        AuditLogResponse dto = new AuditLogResponse();
        dto.setId(entity.getAuditId());
        dto.setActorAccountId(entity.getActorAccountId());
        dto.setActorEmail(entity.getActorEmail());
        dto.setActorRole(entity.getActorRole());
        dto.setAction(entity.getAction());
        dto.setResource(entity.getResource());
        dto.setResourceId(entity.getResourceId());
        dto.setActionDescription(entity.getActionDescription());
        dto.setIpAddress(entity.getIpAddress());
        dto.setUserAgent(entity.getUserAgent());
        dto.setCreatedAt(entity.getCreatedAt());

        // Deserialise JSON strings back to objects for a clean API response
        dto.setOldValue(parseJson(entity.getOldValue()));
        dto.setNewValue(parseJson(entity.getNewValue()));

        return dto;
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

    private Object parseJson(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception e) {
            return json;
        }
    }

    /**
     * Escapes a value for CSV output (RFC 4180).
     */
    private String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
