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

import com.companyx.synpay_dashboard.dto.request.CreateUserRequest;
import com.companyx.synpay_dashboard.dto.request.UpdateUserRequest;
import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.UserDetailResponse;
import com.companyx.synpay_dashboard.dto.response.UserResponse;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.companyx.synpay_dashboard.service.AuditLogService;
import com.companyx.synpay_dashboard.service.RbacService;
import com.companyx.synpay_dashboard.service.UserManagementService;
import com.companyx.synpay_dashboard.utils.PermissionConstants;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Internal user management endpoints consumed exclusively by the Python
 * API Gateway.  Every request must carry a valid JWT in the
 * {@code Authorization: Bearer} header.
 * <p>
 * RBAC is enforced per endpoint:
 * <ul>
 *   <li>GET  → {@code user.read}</li>
 *   <li>POST / PUT → {@code user.write}</li>
 * </ul>
 */
@RestController
@RequestMapping("/internal/users")
public class InternalUserController {

    private static final Logger log = LoggerFactory.getLogger(InternalUserController.class);

    private final UserManagementService userManagementService;
    private final RbacService rbacService;
    private final AuditLogService auditLogService;

    public InternalUserController(UserManagementService userManagementService,
                                  RbacService rbacService,
                                  AuditLogService auditLogService) {
        this.userManagementService = userManagementService;
        this.rbacService = rbacService;
        this.auditLogService = auditLogService;
    }

    // ---------------------------------------------------------------
    //  GET /internal/users
    // ---------------------------------------------------------------

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> listUsers() {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.USER_READ);

        List<UserResponse> users = userManagementService.listUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    // ---------------------------------------------------------------
    //  GET /internal/users/{id}
    // ---------------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDetailResponse>> getUser(@PathVariable Integer id) {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.USER_READ);

        UserDetailResponse user = userManagementService.getUser(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    // ---------------------------------------------------------------
    //  POST /internal/users
    // ---------------------------------------------------------------

    @PostMapping
    public ResponseEntity<ApiResponse<UserDetailResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.USER_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            UserDetailResponse created = userManagementService.createUser(
                    request, principal.getAccountId(), ip, ua);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "User created successfully"));
        } catch (Exception ex) {
            log.warn("USER_CREATE failed by actor={}: {}", principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "USER_CREATE", "user",
                    null, null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage(),
                           "email", request.getEmail() != null ? request.getEmail() : ""),
                    ip, ua);
            throw ex;
        }
    }

    // ---------------------------------------------------------------
    //  PUT /internal/users/{id}
    // ---------------------------------------------------------------

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDetailResponse>> updateUser(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.USER_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            UserDetailResponse updated = userManagementService.updateUser(
                    id, request, principal.getAccountId(), ip, ua);

            return ResponseEntity.ok(ApiResponse.success(updated, "User updated successfully"));
        } catch (Exception ex) {
            log.warn("USER_UPDATE failed for id={} by actor={}: {}", id, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "USER_UPDATE", "user",
                    id.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ---------------------------------------------------------------
    //  Helpers
    // ---------------------------------------------------------------

    /**
     * Resolves the real client IP, preferring the {@code X-Forwarded-For}
     * header set by the gateway over the socket address.
     */
    private String resolveIpAddress(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
