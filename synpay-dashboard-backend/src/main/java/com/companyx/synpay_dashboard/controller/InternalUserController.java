package com.companyx.synpay_dashboard.controller;

import com.companyx.synpay_dashboard.dto.request.CreateUserRequest;
import com.companyx.synpay_dashboard.dto.request.UpdateUserRequest;
import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.UserDetailResponse;
import com.companyx.synpay_dashboard.dto.response.UserResponse;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.companyx.synpay_dashboard.service.RbacService;
import com.companyx.synpay_dashboard.service.UserManagementService;
import com.companyx.synpay_dashboard.utils.PermissionConstants;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    private final UserManagementService userManagementService;
    private final RbacService rbacService;

    public InternalUserController(UserManagementService userManagementService,
                                  RbacService rbacService) {
        this.userManagementService = userManagementService;
        this.rbacService = rbacService;
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

        UserDetailResponse created = userManagementService.createUser(
                request,
                principal.getAccountId(),
                resolveIpAddress(httpRequest),
                httpRequest.getHeader("User-Agent"));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "User created successfully"));
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

        UserDetailResponse updated = userManagementService.updateUser(
                id,
                request,
                principal.getAccountId(),
                resolveIpAddress(httpRequest),
                httpRequest.getHeader("User-Agent"));

        return ResponseEntity.ok(ApiResponse.success(updated, "User updated successfully"));
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
