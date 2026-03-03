package com.companyx.synpay_dashboard.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.companyx.synpay_dashboard.dto.request.AuditLogExportRequest;
import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.AuditLogPageResponse;
import com.companyx.synpay_dashboard.dto.response.AuditLogResponse;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.companyx.synpay_dashboard.service.AuditLogService;
import com.companyx.synpay_dashboard.service.RbacService;
import com.companyx.synpay_dashboard.utils.PermissionConstants;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Internal audit log endpoints consumed exclusively by the Python API Gateway.
 * Every request must carry a valid JWT in the {@code Authorization: Bearer}
 * header.
 * <p>
 * RBAC enforced per endpoint:
 * <ul>
 *   <li>GET  endpoints → {@code audit.read}</li>
 *   <li>POST /export  → {@code audit.export}</li>
 * </ul>
 * <p>
 * Audit logs are <strong>immutable and read-only</strong> from this
 * controller — there are no PUT/PATCH/DELETE endpoints.
 */
@RestController
@RequestMapping("/internal/audit-logs")
public class InternalAuditLogController {

    private static final Logger log = LoggerFactory.getLogger(InternalAuditLogController.class);
    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final AuditLogService auditLogService;
    private final RbacService rbacService;

    public InternalAuditLogController(AuditLogService auditLogService,
                                      RbacService rbacService) {
        this.auditLogService = auditLogService;
        this.rbacService = rbacService;
    }

    // ===================================================================
    //  GET /internal/audit-logs — paginated, filtered list
    // ===================================================================

    /**
     * Returns a paginated list of audit log entries with optional filters.
     *
     * @param actorEmail partial match on actor email
     * @param action     exact match on action verb (e.g. USER_CREATE)
     * @param resource   exact match on resource type (e.g. "user")
     * @param dateFrom   ISO-8601 date-time start (inclusive)
     * @param dateTo     ISO-8601 date-time end (inclusive)
     * @param page       zero-based page index (default 0)
     * @param size       page size (default 20, max 100)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<AuditLogPageResponse>> list(
            @RequestParam(required = false) String actorEmail,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resource,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {

        try {
            GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
            rbacService.requirePermission(principal.getAccountId(), PermissionConstants.AUDIT_READ);

            // Clamp page size to [1, 100]
            size = Math.max(1, Math.min(size, 100));

            LocalDateTime from = parseDate(dateFrom);
            LocalDateTime to = parseDate(dateTo);

            AuditLogPageResponse data = auditLogService.findAll(
                    actorEmail, action, resource, from, to, page, size);

            return ResponseEntity.ok(ApiResponse.success(data));

        } catch (com.companyx.synpay_dashboard.exceptions.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to list audit logs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve audit logs"));
        }
    }

    // ===================================================================
    //  GET /internal/audit-logs/{id} — single entry detail
    // ===================================================================

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AuditLogResponse>> getById(
            @PathVariable Long id,
            HttpServletRequest request) {

        try {
            GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
            rbacService.requirePermission(principal.getAccountId(), PermissionConstants.AUDIT_READ);

            AuditLogResponse dto = auditLogService.findById(id);
            if (dto == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Audit log entry not found: " + id));
            }
            return ResponseEntity.ok(ApiResponse.success(dto));

        } catch (com.companyx.synpay_dashboard.exceptions.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to get audit log #{}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve audit log"));
        }
    }

    // ===================================================================
    //  POST /internal/audit-logs/export — CSV export
    // ===================================================================

    /**
     * Exports filtered audit log entries as a CSV file download.
     * Requires the {@code audit.export} permission.
     */
    @PostMapping("/export")
    public ResponseEntity<?> export(
            @RequestBody(required = false) AuditLogExportRequest body,
            HttpServletRequest request) {

        try {
            GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
            rbacService.requirePermission(principal.getAccountId(), PermissionConstants.AUDIT_LOG_EXPORT);

            if (body == null) {
                body = new AuditLogExportRequest();
            }

            LocalDateTime from = parseDate(body.getDateFrom());
            LocalDateTime to = parseDate(body.getDateTo());

            String csv = auditLogService.exportCsv(
                    body.getActorEmail(),
                    body.getAction(),
                    body.getResource(),
                    from, to);

            // Log the export action itself
            auditLogService.log(
                    principal.getAccountId(),
                    "DATA_EXPORT",
                    "audit_log",
                    null,
                    null,
                    null,
                    request.getRemoteAddr(),
                    request.getHeader("User-Agent"));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"audit-logs-export.csv\"");

            return new ResponseEntity<>(csv, headers, HttpStatus.OK);

        } catch (com.companyx.synpay_dashboard.exceptions.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to export audit logs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to export audit logs"));
        }
    }

    // ===================================================================
    //  Utility
    // ===================================================================

    /**
     * Safely parses an ISO-8601 date-time string, returning {@code null}
     * if the input is {@code null}, blank, or malformed.
     */
    private LocalDateTime parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value, DT_FMT);
        } catch (DateTimeParseException e) {
            log.warn("Invalid date-time filter value: {}", value);
            return null;
        }
    }
}
