package com.companyx.synpay_dashboard.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.dto.response.LoginResponse;
import com.companyx.synpay_dashboard.entity.auth.Account;
import com.companyx.synpay_dashboard.entity.auth.AccountRole;
import com.companyx.synpay_dashboard.entity.auth.Role;
import com.companyx.synpay_dashboard.exceptions.BusinessException;
import com.companyx.synpay_dashboard.repository.auth.AccountRepository;
import com.companyx.synpay_dashboard.repository.auth.PermissionRepository;
import com.companyx.synpay_dashboard.security.jwt.JwtTokenProvider;

/**
 * Handles user authentication for the internal login endpoint.
 * <p>
 * Flow:
 * <ol>
 *   <li>Look up account by email</li>
 *   <li>Verify password hash</li>
 *   <li>Check account status (active / inactive / locked)</li>
 *   <li>Resolve role and permissions from auth_db</li>
 *   <li>Generate JWT access token</li>
 *   <li>Record audit log entry (success or failure)</li>
 *   <li>Update {@code last_login_at} on the account</li>
 * </ol>
 */
@Service
public class AuthenticationService {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

    private final AccountRepository accountRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditLogService auditLogService;

    public AuthenticationService(AccountRepository accountRepository,
                                 PermissionRepository permissionRepository,
                                 PasswordEncoder passwordEncoder,
                                 JwtTokenProvider jwtTokenProvider,
                                 AuditLogService auditLogService) {
        this.accountRepository = accountRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.auditLogService = auditLogService;
    }

    /**
     * Authenticates the user and returns a {@link LoginResponse} containing the
     * JWT access token and the resolved RBAC context.
     *
     * @param email     the user's email
     * @param password  the raw password
     * @param ipAddress client IP (forwarded by the gateway)
     * @param userAgent browser user-agent (forwarded by the gateway)
     * @return the login response with access token + identity + permissions
     * @throws BusinessException if credentials are invalid or account is not active
     */
    @Transactional(transactionManager = "authTransactionManager")
    public LoginResponse authenticate(String email,
                                      String password,
                                      String ipAddress,
                                      String userAgent) {

        // 1. Look up account
        Account account = accountRepository.findByEmail(email).orElse(null);

        if (account == null) {
            log.warn("Login failed – email not found: {}", email);
            auditLogService.log(
                    0, "LOGIN_FAILED", "account", null,
                    null, Map.of("email", email, "reason", "email_not_found"),
                    ipAddress, userAgent);
            throw new BusinessException("Invalid email or password");
        }

        // 2. Verify password
        if (!passwordEncoder.matches(password, account.getPasswordHash())) {
            log.warn("Login failed – wrong password for account_id={}", account.getAccountId());
            auditLogService.log(
                    account.getAccountId(), "LOGIN_FAILED", "account",
                    String.valueOf(account.getAccountId()),
                    null, Map.of("reason", "invalid_password"),
                    ipAddress, userAgent);
            throw new BusinessException("Invalid email or password");
        }

        // 3. Check account status
        String status = account.getStatus();
        if (!"active".equalsIgnoreCase(status)) {
            log.warn("Login failed – account_id={} status={}", account.getAccountId(), status);
            auditLogService.log(
                    account.getAccountId(), "LOGIN_FAILED", "account",
                    String.valueOf(account.getAccountId()),
                    null, Map.of("reason", "account_" + status),
                    ipAddress, userAgent);

            String message = switch (status != null ? status.toLowerCase() : "") {
                case "locked"   -> "Account is locked. Please contact your administrator.";
                case "inactive" -> "Account is inactive. Please contact your administrator.";
                default         -> "Account is not active. Current status: " + status;
            };
            throw new BusinessException(message);
        }

        // 4. Resolve role (use the first assigned role; accounts typically have one role)
        Set<AccountRole> accountRoles = account.getAccountRoles();
        if (accountRoles == null || accountRoles.isEmpty()) {
            log.warn("Login failed – account_id={} has no roles assigned", account.getAccountId());
            auditLogService.log(
                    account.getAccountId(), "LOGIN_FAILED", "account",
                    String.valueOf(account.getAccountId()),
                    null, Map.of("reason", "no_role_assigned"),
                    ipAddress, userAgent);
            throw new BusinessException("No role assigned to this account. Please contact your administrator.");
        }

        // Pick the first role (deterministic via LinkedHashSet ordering)
        Role primaryRole = accountRoles.iterator().next().getRole();
        String roleCode = primaryRole.getCode();

        // 5. Resolve permissions
        List<String> permissions = permissionRepository
                .findEnabledPermissionKeysByAccountId(account.getAccountId());

        // 6. Generate JWT
        String accessToken = jwtTokenProvider.generateToken(
                account.getAccountId(),
                account.getEmail(),
                account.getEmployeeId(),
                roleCode,
                permissions);

        long expiresInSeconds = jwtTokenProvider.getExpirationMs() / 1000;

        // 7. Update last_login_at
        account.setLastLoginAt(LocalDateTime.now());
        accountRepository.save(account);

        // 8. Audit success
        auditLogService.log(
                account.getAccountId(), "LOGIN_SUCCESS", "account",
                String.valueOf(account.getAccountId()),
                null,
                Map.of("role", roleCode, "permissions_count", permissions.size()),
                ipAddress, userAgent);

        log.info("Login successful – account_id={} role={} permissions={}",
                account.getAccountId(), roleCode, permissions.size());

        // 9. Build response
        return new LoginResponse()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(expiresInSeconds)
                .accountId(account.getAccountId())
                .role(roleCode)
                .employeeId(account.getEmployeeId())
                .permissions(permissions);
    }
}
