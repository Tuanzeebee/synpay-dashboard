package com.companyx.synpay_dashboard.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.companyx.synpay_dashboard.dto.request.UpdatePermissionMatrixRequest;
import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.PermissionMatrixResponse;
import com.companyx.synpay_dashboard.dto.response.PermissionSummaryResponse;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.companyx.synpay_dashboard.service.AuditLogService;
import com.companyx.synpay_dashboard.service.PermissionMatrixService;
import com.companyx.synpay_dashboard.service.RbacService;
import com.companyx.synpay_dashboard.utils.PermissionConstants;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Internal API for Permission Matrix Management.
 *
 * <p>All endpoints are called exclusively by the FastAPI API Gateway.
 * JWT authentication is handled by {@code InternalApiAuthFilter}.
 * RBAC is enforced per-endpoint through {@link RbacService}.</p>
 */
@RestController
@RequestMapping("/internal")
public class InternalPermissionMatrixController {

    private static final Logger log = LoggerFactory.getLogger(InternalPermissionMatrixController.class);

    private final PermissionMatrixService permissionMatrixService;
    private final RbacService rbacService;
    private final AuditLogService auditLogService;

    public InternalPermissionMatrixController(PermissionMatrixService permissionMatrixService,
                                              RbacService rbacService,
                                              AuditLogService auditLogService) {
        this.permissionMatrixService = permissionMatrixService;
        this.rbacService = rbacService;
        this.auditLogService = auditLogService;
    }

    // ── GET /internal/permission-matrix ──────────────────────────

    @GetMapping("/permission-matrix")
    public ResponseEntity<ApiResponse<PermissionMatrixResponse>> getPermissionMatrix() {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.PERMISSION_MATRIX_READ);

        PermissionMatrixResponse matrix = permissionMatrixService.getPermissionMatrix();
        return ResponseEntity.ok(ApiResponse.success(matrix));
    }

    // ── PUT /internal/permission-matrix ──────────────────────────

    @PutMapping("/permission-matrix")
    public ResponseEntity<ApiResponse<PermissionMatrixResponse>> updatePermissionMatrix(
            @Valid @RequestBody UpdatePermissionMatrixRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.PERMISSION_MATRIX_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            PermissionMatrixResponse matrix = permissionMatrixService.updatePermissionMatrix(
                    request, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(matrix, "Permission matrix updated successfully"));
        } catch (Exception ex) {
            log.warn("PERMISSION_MATRIX_UPDATE failed by actor={}: {}", principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "PERMISSION_MATRIX_UPDATE", "permission_matrix",
                    request.getRoleId() != null ? request.getRoleId().toString() : null, null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage(),
                           "domain", request.getDomain() != null ? request.getDomain() : "",
                           "action", request.getAction() != null ? request.getAction() : ""),
                    ip, ua);
            throw ex;
        }
    }

    // ── GET /internal/roles/{id}/permissions/summary ─────────────

    @GetMapping("/roles/{id}/permissions/summary")
    public ResponseEntity<ApiResponse<PermissionSummaryResponse>> getPermissionSummary(
            @PathVariable Integer id) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.PERMISSION_MATRIX_READ);

        PermissionSummaryResponse summary = permissionMatrixService.getPermissionSummary(id);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    // ── Helper ───────────────────────────────────────────────────

    private String resolveIpAddress(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
