package com.companyx.synpay_dashboard.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.companyx.synpay_dashboard.dto.request.CreatePositionRequest;
import com.companyx.synpay_dashboard.dto.request.UpdatePositionRequest;
import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.PositionPageResponse;
import com.companyx.synpay_dashboard.dto.response.PositionResponse;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.companyx.synpay_dashboard.service.AuditLogService;
import com.companyx.synpay_dashboard.service.PositionService;
import com.companyx.synpay_dashboard.service.RbacService;
import com.companyx.synpay_dashboard.utils.PermissionConstants;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Internal Position management endpoints.
 * <p>
 * RBAC:
 * <ul>
 *   <li>GET  endpoints → {@code position.read}</li>
 *   <li>POST / PUT endpoints → {@code position.write}</li>
 * </ul>
 */
@RestController
@RequestMapping("/internal/positions")
public class InternalPositionController {

    private static final Logger log = LoggerFactory.getLogger(InternalPositionController.class);

    private final PositionService positionService;
    private final RbacService rbacService;
    private final AuditLogService auditLogService;

    public InternalPositionController(PositionService positionService,
                                      RbacService rbacService,
                                      AuditLogService auditLogService) {
        this.positionService = positionService;
        this.rbacService = rbacService;
        this.auditLogService = auditLogService;
    }

    // ============================== LIST ==============================

    @GetMapping
    public ResponseEntity<ApiResponse<PositionPageResponse>> listPositions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.POSITION_READ);

        PositionPageResponse result = positionService.listPositions(page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ============================== GET BY ID ==============================

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PositionResponse>> getPosition(@PathVariable Integer id) {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.POSITION_READ);

        PositionResponse position = positionService.getPosition(id);
        return ResponseEntity.ok(ApiResponse.success(position));
    }

    // ============================== CREATE ==============================

    @PostMapping
    public ResponseEntity<ApiResponse<PositionResponse>> createPosition(
            @Valid @RequestBody CreatePositionRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.POSITION_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            PositionResponse created = positionService.createPosition(
                    request, principal.getAccountId(), ip, ua);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "Position created successfully"));
        } catch (Exception ex) {
            log.warn("POSITION_CREATE failed by actor={}: {}", principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "POSITION_CREATE", "position",
                    null, null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ============================== UPDATE ==============================

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PositionResponse>> updatePosition(
            @PathVariable Integer id,
            @Valid @RequestBody UpdatePositionRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.POSITION_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            PositionResponse updated = positionService.updatePosition(
                    id, request, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(updated, "Position updated successfully"));
        } catch (Exception ex) {
            log.warn("POSITION_UPDATE failed for id={} by actor={}: {}",
                    id, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "POSITION_UPDATE", "position",
                    id.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ============================== DELETE ==============================

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePosition(
            @PathVariable Integer id,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.POSITION_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            positionService.deletePosition(id, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(null, "Position deleted successfully"));
        } catch (Exception ex) {
            log.warn("POSITION_DELETE failed for id={} by actor={}: {}",
                    id, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "POSITION_DELETE", "position",
                    id.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ============================== HELPER ==============================

    private String resolveIpAddress(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
