package com.companyx.synpay_dashboard.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.companyx.synpay_dashboard.dto.request.AssignPermissionsRequest;
import com.companyx.synpay_dashboard.dto.request.CreateRoleRequest;
import com.companyx.synpay_dashboard.dto.request.UpdateRoleRequest;
import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.RoleDetailResponse;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.companyx.synpay_dashboard.service.AuditLogService;
import com.companyx.synpay_dashboard.service.RbacService;
import com.companyx.synpay_dashboard.service.RoleManagementService;
import com.companyx.synpay_dashboard.utils.PermissionConstants;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Internal API for Role Management with Customizable Permissions.
 *
 * All endpoints are called exclusively by the FastAPI API Gateway.
 * JWT authentication is handled by {@code InternalApiAuthFilter}.
 * RBAC is enforced per-endpoint through {@link RbacService}.
 */
@RestController
@RequestMapping("/internal/roles")
public class InternalRoleController {

    private static final Logger log = LoggerFactory.getLogger(InternalRoleController.class);

    private final RoleManagementService roleManagementService;
    private final RbacService rbacService;
    private final AuditLogService auditLogService;

    public InternalRoleController(RoleManagementService roleManagementService,
                                  RbacService rbacService,
                                  AuditLogService auditLogService) {
        this.roleManagementService = roleManagementService;
        this.rbacService = rbacService;
        this.auditLogService = auditLogService;
    }

    // ── GET /internal/roles ──────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleDetailResponse>>> listRoles() {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.ROLE_READ);

        List<RoleDetailResponse> roles = roleManagementService.listRoles();
        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    // ── GET /internal/roles/{id} ─────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleDetailResponse>> getRole(@PathVariable Integer id) {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.ROLE_READ);

        RoleDetailResponse role = roleManagementService.getRole(id);
        return ResponseEntity.ok(ApiResponse.success(role));
    }

    // ── POST /internal/roles ─────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<RoleDetailResponse>> createRole(
            @Valid @RequestBody CreateRoleRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.ROLE_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            RoleDetailResponse created = roleManagementService.createRole(
                    request, principal.getAccountId(), ip, ua);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "Role created successfully"));
        } catch (Exception ex) {
            log.warn("ROLE_CREATE failed by actor={}: {}", principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "ROLE_CREATE", "role",
                    null, null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage(),
                           "code", request.getCode() != null ? request.getCode() : ""),
                    ip, ua);
            throw ex;
        }
    }

    // ── PUT /internal/roles/{id} ─────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleDetailResponse>> updateRole(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateRoleRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.ROLE_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            RoleDetailResponse updated = roleManagementService.updateRole(
                    id, request, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(updated, "Role updated successfully"));
        } catch (Exception ex) {
            log.warn("ROLE_UPDATE failed for id={} by actor={}: {}", id, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "ROLE_UPDATE", "role",
                    id.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ── PUT /internal/roles/{id}/permissions ─────────────────────

    @PutMapping("/{id}/permissions")
    public ResponseEntity<ApiResponse<RoleDetailResponse>> assignPermissions(
            @PathVariable Integer id,
            @Valid @RequestBody AssignPermissionsRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.PERMISSION_ASSIGN);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            RoleDetailResponse result = roleManagementService.assignPermissions(
                    id, request, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(result, "Permissions assigned successfully"));
        } catch (Exception ex) {
            log.warn("PERMISSION_ASSIGN failed for roleId={} by actor={}: {}",
                    id, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "PERMISSION_ASSIGN", "role",
                    id.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
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
