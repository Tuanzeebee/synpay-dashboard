package com.companyx.synpay_dashboard.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.companyx.synpay_dashboard.dto.request.LoginRequest;
import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.LoginResponse;
import com.companyx.synpay_dashboard.security.GatewayAuthenticationToken;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.service.AuthenticationService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Internal authentication controller consumed by the API Gateway (FastAPI).
 * <p>
 * This is <b>not</b> exposed directly to the frontend. The API Gateway
 * forwards login requests here, receives the JWT and RBAC payload, then
 * relays them back to the client.
 *
 * <p>Endpoint: {@code POST /internal/auth/login}
 */
@RestController
@RequestMapping("/internal/auth")
public class InternalAuthController {

    private final AuthenticationService authenticationService;

    public InternalAuthController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    /**
     * Authenticate user credentials and return a JWT access token with RBAC context.
     *
     * @param request     login credentials (email + password)
     * @param httpRequest servlet request (for IP / user-agent extraction)
     * @return access token, role, employee_id, and permissions
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = resolveIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        LoginResponse loginResponse = authenticationService.authenticate(
                request.getEmail(),
                request.getPassword(),
                ipAddress,
                userAgent);

        return ResponseEntity.ok(ApiResponse.success(loginResponse, "Login successful"));
    }

    /**
     * Log out the current authenticated user.
     * <p>
     * This endpoint requires a valid JWT in the Authorization header.
     * It updates {@code last_logout_at} on the account and records an audit log entry.
     *
     * @param httpRequest servlet request (for IP / user-agent and principal extraction)
     * @return success message
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest httpRequest) {
        String ipAddress = resolveIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof GatewayAuthenticationToken gatewayAuth) {
            GatewayPrincipal principal = gatewayAuth.getPrincipal();
            authenticationService.logout(principal.getAccountId(), ipAddress, userAgent);
        }

        return ResponseEntity.ok(ApiResponse.success(null, "Logout successful"));
    }

    private String resolveIpAddress(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
