package com.companyx.synpay_dashboard.service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.dto.request.CreateUserRequest;
import com.companyx.synpay_dashboard.dto.request.UpdateUserRequest;
import com.companyx.synpay_dashboard.dto.response.PermissionResponse;
import com.companyx.synpay_dashboard.dto.response.RoleResponse;
import com.companyx.synpay_dashboard.dto.response.UserDetailResponse;
import com.companyx.synpay_dashboard.dto.response.UserDetailResponse.RoleDetailResponse;
import com.companyx.synpay_dashboard.dto.response.UserResponse;
import com.companyx.synpay_dashboard.entity.auth.Account;
import com.companyx.synpay_dashboard.entity.auth.AccountRole;
import com.companyx.synpay_dashboard.entity.auth.Role;
import com.companyx.synpay_dashboard.entity.auth.RolePermission;
import com.companyx.synpay_dashboard.exceptions.BusinessException;
import com.companyx.synpay_dashboard.exceptions.ResourceNotFoundException;
import com.companyx.synpay_dashboard.repository.auth.AccountRepository;
import com.companyx.synpay_dashboard.repository.auth.AccountRoleRepository;
import com.companyx.synpay_dashboard.repository.auth.RolePermissionRepository;
import com.companyx.synpay_dashboard.repository.auth.RoleRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Core business logic for user (account) CRUD operations.
 * All write methods also persist an audit log entry atomically.
 */
@Service
public class UserManagementService {

    private static final Logger log = LoggerFactory.getLogger(UserManagementService.class);

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final AccountRoleRepository accountRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;

    @PersistenceContext(unitName = "authEntityManagerFactory")
    private EntityManager entityManager;

    public UserManagementService(AccountRepository accountRepository,
                                 RoleRepository roleRepository,
                                 AccountRoleRepository accountRoleRepository,
                                 RolePermissionRepository rolePermissionRepository,
                                 AuditLogService auditLogService,
                                 PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.accountRoleRepository = accountRoleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.auditLogService = auditLogService;
        this.passwordEncoder = passwordEncoder;
    }

    // ===================================================================
    //  READ operations
    // ===================================================================

    @Transactional(transactionManager = "authTransactionManager", readOnly = true)
    public List<UserResponse> listUsers() {
        List<Account> accounts = accountRepository.findAllWithRoles();
        return accounts.stream().map(this::toUserResponse).toList();
    }

    @Transactional(transactionManager = "authTransactionManager", readOnly = true)
    public UserDetailResponse getUser(Integer accountId) {
        Account account = accountRepository.findByIdWithRoles(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));

        // Resolve permissions per role
        List<Integer> roleIds = account.getAccountRoles().stream()
                .map(ar -> ar.getRole().getRoleId())
                .toList();

        Map<Integer, List<RolePermission>> permsByRole = Collections.emptyMap();
        if (!roleIds.isEmpty()) {
            permsByRole = rolePermissionRepository.findByRoleIdsWithPermission(roleIds)
                    .stream()
                    .collect(Collectors.groupingBy(rp -> rp.getRole().getRoleId()));
        }

        return toUserDetailResponse(account, permsByRole);
    }

    // ===================================================================
    //  WRITE operations
    // ===================================================================

    @Transactional(transactionManager = "authTransactionManager")
    public UserDetailResponse createUser(CreateUserRequest request,
                                         Integer actorAccountId,
                                         String ipAddress,
                                         String userAgent) {

        // Business rule: unique email
        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already registered: " + request.getEmail());
        }

        // Validate roles exist
        Set<Integer> requestedRoleIds = request.getRoleIds();
        List<Role> roles = roleRepository.findAllByIds(requestedRoleIds);
        if (roles.size() != requestedRoleIds.size()) {
            throw new BusinessException("One or more role IDs are invalid");
        }

        // Create account
        Account account = new Account();
        account.setEmail(request.getEmail());
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setEmployeeId(request.getEmployeeId());
        account.setStatus(request.getStatus() != null ? request.getStatus() : "active");
        account = accountRepository.saveAndFlush(account);

        // Assign roles
        for (Role role : roles) {
            AccountRole ar = new AccountRole();
            ar.setAccount(account);
            ar.setRole(role);
            ar.setAssignedBy(actorAccountId);
            accountRoleRepository.saveAndFlush(ar);
        }

        // Clear L1 cache so the JPQL fetch join returns fresh data
        entityManager.clear();

        // Reload with roles for response
        Account saved = accountRepository.findByIdWithRoles(account.getAccountId())
                .orElseThrow();

        // Audit – USER_CREATE
        Map<String, Object> newSnapshot = toAuditSnapshot(saved);
        newSnapshot.put("result", "SUCCESS");
        auditLogService.log(actorAccountId, "USER_CREATE", "user",
                saved.getAccountId().toString(), null,
                newSnapshot, ipAddress, userAgent);

        log.info("User created: accountId={} email={} by actor={}",
                saved.getAccountId(), saved.getEmail(), actorAccountId);

        return getUser(saved.getAccountId());
    }

    @Transactional(transactionManager = "authTransactionManager")
    public UserDetailResponse updateUser(Integer accountId,
                                         UpdateUserRequest request,
                                         Integer actorAccountId,
                                         String ipAddress,
                                         String userAgent) {

        Account account = accountRepository.findByIdWithRoles(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));

        // Snapshot old state for audit
        Map<String, Object> oldSnapshot = toAuditSnapshot(account);

        // Update email
        if (request.getEmail() != null) {
            if (!request.getEmail().equals(account.getEmail())
                    && accountRepository.existsByEmail(request.getEmail())) {
                throw new BusinessException("Email already registered: " + request.getEmail());
            }
            account.setEmail(request.getEmail());
        }

        // Update password
        if (request.getPassword() != null) {
            account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        // Update status
        if (request.getStatus() != null) {
            account.setStatus(request.getStatus());
        }

        // Update employee_id
        if (request.getEmployeeId() != null) {
            account.setEmployeeId(request.getEmployeeId());
        }

        accountRepository.saveAndFlush(account);

        // Update role assignments
        if (request.getRoleIds() != null) {
            Set<Integer> requestedRoleIds = request.getRoleIds();
            List<Role> roles = roleRepository.findAllByIds(requestedRoleIds);
            if (roles.size() != requestedRoleIds.size()) {
                throw new BusinessException("One or more role IDs are invalid");
            }

            // Capture old role IDs for ROLE_ASSIGN audit
            List<Integer> oldRoleIds = account.getAccountRoles().stream()
                    .map(ar -> ar.getRole().getRoleId())
                    .toList();

            accountRoleRepository.deleteAllByAccountId(accountId);
            accountRoleRepository.flush();

            for (Role role : roles) {
                AccountRole ar = new AccountRole();
                ar.setAccount(account);
                ar.setRole(role);
                ar.setAssignedBy(actorAccountId);
                accountRoleRepository.saveAndFlush(ar);
            }

            // Audit – ROLE_ASSIGN (separate entry for role changes)
            Map<String, Object> roleAuditOld = new LinkedHashMap<>();
            roleAuditOld.put("roleIds", oldRoleIds);
            Map<String, Object> roleAuditNew = new LinkedHashMap<>();
            roleAuditNew.put("roleIds", requestedRoleIds);
            roleAuditNew.put("result", "SUCCESS");
            auditLogService.log(actorAccountId, "ROLE_ASSIGN", "user",
                    accountId.toString(), roleAuditOld,
                    roleAuditNew, ipAddress, userAgent);
        }

        // Clear L1 cache so the JPQL fetch join returns fresh data
        entityManager.clear();

        // Reload for response
        Account updated = accountRepository.findByIdWithRoles(accountId).orElseThrow();

        // Audit – USER_UPDATE
        Map<String, Object> newSnapshot = toAuditSnapshot(updated);
        newSnapshot.put("result", "SUCCESS");
        auditLogService.log(actorAccountId, "USER_UPDATE", "user",
                accountId.toString(), oldSnapshot,
                newSnapshot, ipAddress, userAgent);

        log.info("User updated: accountId={} by actor={}", accountId, actorAccountId);

        return getUser(accountId);
    }

    // ===================================================================
    //  Mapping helpers
    // ===================================================================

    private UserResponse toUserResponse(Account account) {
        UserResponse dto = new UserResponse();
        dto.setAccountId(account.getAccountId());
        dto.setEmail(account.getEmail());
        dto.setEmployeeId(account.getEmployeeId());
        dto.setStatus(account.getStatus());
        dto.setCreatedAt(account.getCreatedAt());
        dto.setLastLoginAt(account.getLastLoginAt());
        dto.setRoles(account.getAccountRoles().stream()
                .map(ar -> new RoleResponse(
                        ar.getRole().getRoleId(),
                        ar.getRole().getCode(),
                        ar.getRole().getName()))
                .toList());
        return dto;
    }

    private UserDetailResponse toUserDetailResponse(Account account,
                                                    Map<Integer, List<RolePermission>> permsByRole) {
        UserDetailResponse dto = new UserDetailResponse();
        dto.setAccountId(account.getAccountId());
        dto.setEmail(account.getEmail());
        dto.setEmployeeId(account.getEmployeeId());
        dto.setStatus(account.getStatus());
        dto.setCreatedAt(account.getCreatedAt());
        dto.setUpdatedAt(account.getUpdatedAt());
        dto.setLastLoginAt(account.getLastLoginAt());
        dto.setLastLogoutAt(account.getLastLogoutAt());

        dto.setRoles(account.getAccountRoles().stream().map(ar -> {
            Role role = ar.getRole();
            RoleDetailResponse rd = new RoleDetailResponse();
            rd.setRoleId(role.getRoleId());
            rd.setCode(role.getCode());
            rd.setName(role.getName());

            List<RolePermission> rps = permsByRole.getOrDefault(role.getRoleId(), List.of());
            rd.setPermissions(rps.stream()
                    .map(rp -> new PermissionResponse(
                            rp.getPermission().getPermissionId(),
                            rp.getPermission().getKey(),
                            rp.getPermission().getName(),
                            rp.getEnabled()))
                    .toList());
            return rd;
        }).toList());

        return dto;
    }

    private Map<String, Object> toAuditSnapshot(Account account) {
        Map<String, Object> snap = new LinkedHashMap<>();
        snap.put("accountId", account.getAccountId());
        snap.put("email", account.getEmail());
        snap.put("employeeId", account.getEmployeeId());
        snap.put("status", account.getStatus());
        snap.put("roles", account.getAccountRoles().stream()
                .map(ar -> ar.getRole().getRoleId())
                .toList());
        return snap;
    }
}
