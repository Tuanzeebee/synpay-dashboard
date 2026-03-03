package com.companyx.synpay_dashboard.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.dto.request.AssignPermissionsRequest;
import com.companyx.synpay_dashboard.dto.request.AssignPermissionsRequest.PermissionEntry;
import com.companyx.synpay_dashboard.dto.request.CreateRoleRequest;
import com.companyx.synpay_dashboard.dto.request.UpdateRoleRequest;
import com.companyx.synpay_dashboard.dto.response.PermissionResponse;
import com.companyx.synpay_dashboard.dto.response.RoleDetailResponse;
import com.companyx.synpay_dashboard.entity.auth.Permission;
import com.companyx.synpay_dashboard.entity.auth.Role;
import com.companyx.synpay_dashboard.entity.auth.RolePermission;
import com.companyx.synpay_dashboard.exceptions.BusinessException;
import com.companyx.synpay_dashboard.exceptions.ResourceNotFoundException;
import com.companyx.synpay_dashboard.repository.auth.AccountRoleRepository;
import com.companyx.synpay_dashboard.repository.auth.PermissionRepository;
import com.companyx.synpay_dashboard.repository.auth.RolePermissionRepository;
import com.companyx.synpay_dashboard.repository.auth.RoleRepository;

/**
 * Core business logic for Role Management with Customizable Permissions.
 *
 * All write methods persist audit log entries atomically via {@link AuditLogService}.
 */
@Service
public class RoleManagementService {

    private static final Logger log = LoggerFactory.getLogger(RoleManagementService.class);

    /** Role codes that cannot be modified or deleted through the API. */
    private static final Set<String> SYSTEM_ROLE_CODES = Set.of("ADMIN");

    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;
    private final AccountRoleRepository accountRoleRepository;
    private final AuditLogService auditLogService;

    public RoleManagementService(RoleRepository roleRepository,
                                 RolePermissionRepository rolePermissionRepository,
                                 PermissionRepository permissionRepository,
                                 AccountRoleRepository accountRoleRepository,
                                 AuditLogService auditLogService) {
        this.roleRepository = roleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.permissionRepository = permissionRepository;
        this.accountRoleRepository = accountRoleRepository;
        this.auditLogService = auditLogService;
    }

    // ===================================================================
    //  READ operations
    // ===================================================================

    /**
     * List all roles with basic information and user count.
     */
    @Transactional(transactionManager = "authTransactionManager", readOnly = true)
    public List<RoleDetailResponse> listRoles() {
        List<Role> roles = roleRepository.findAll();

        // Build user-count map in a single query
        Map<Integer, Long> userCountMap = accountRoleRepository.countUsersGroupByRole()
                .stream()
                .collect(Collectors.toMap(
                        row -> (Integer) row[0],
                        row -> (Long) row[1]
                ));

        return roles.stream()
                .map(role -> toListResponse(role, userCountMap.getOrDefault(role.getRoleId(), 0L)))
                .toList();
    }

    /**
     * Get role details including all permissions for that role.
     */
    @Transactional(transactionManager = "authTransactionManager", readOnly = true)
    public RoleDetailResponse getRole(Integer roleId) {
        Role role = roleRepository.findByIdWithPermissions(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", roleId));

        // User count for this role
        Map<Integer, Long> userCountMap = accountRoleRepository.countUsersGroupByRole()
                .stream()
                .collect(Collectors.toMap(
                        row -> (Integer) row[0],
                        row -> (Long) row[1]
                ));

        return toDetailResponse(role, userCountMap.getOrDefault(roleId, 0L));
    }

    // ===================================================================
    //  WRITE operations
    // ===================================================================

    /**
     * Create a new role.
     */
    @Transactional(transactionManager = "authTransactionManager")
    public RoleDetailResponse createRole(CreateRoleRequest request,
                                         Integer actorAccountId,
                                         String ipAddress,
                                         String userAgent) {

        // Validate code uniqueness
        if (roleRepository.existsByCode(request.getCode())) {
            throw new BusinessException("Role code already exists: " + request.getCode());
        }

        Role role = new Role();
        role.setCode(request.getCode().toUpperCase());
        role.setName(request.getName());
        role.setDescription(request.getDescription());
        role.setResponsibility(request.getResponsibility());

        role = roleRepository.saveAndFlush(role);

        // Audit
        Map<String, Object> newSnapshot = toAuditSnapshot(role);
        newSnapshot.put("result", "SUCCESS");
        auditLogService.log(actorAccountId, "ROLE_CREATE", "role",
                role.getRoleId().toString(), null,
                newSnapshot, ipAddress, userAgent);

        log.info("Role created: roleId={} code={} by actor={}",
                role.getRoleId(), role.getCode(), actorAccountId);

        return toListResponse(role, 0L);
    }

    /**
     * Update role metadata (name, description, responsibility).
     */
    @Transactional(transactionManager = "authTransactionManager")
    public RoleDetailResponse updateRole(Integer roleId,
                                         UpdateRoleRequest request,
                                         Integer actorAccountId,
                                         String ipAddress,
                                         String userAgent) {

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", roleId));

        Map<String, Object> oldSnapshot = toAuditSnapshot(role);

        if (request.getName() != null) {
            role.setName(request.getName());
        }
        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }
        if (request.getResponsibility() != null) {
            role.setResponsibility(request.getResponsibility());
        }

        roleRepository.saveAndFlush(role);

        // Audit
        Map<String, Object> newSnapshot = toAuditSnapshot(role);
        newSnapshot.put("result", "SUCCESS");
        auditLogService.log(actorAccountId, "ROLE_UPDATE", "role",
                roleId.toString(), oldSnapshot,
                newSnapshot, ipAddress, userAgent);

        log.info("Role updated: roleId={} by actor={}", roleId, actorAccountId);

        // Return with user count
        Map<Integer, Long> userCountMap = accountRoleRepository.countUsersGroupByRole()
                .stream()
                .collect(Collectors.toMap(
                        row -> (Integer) row[0],
                        row -> (Long) row[1]
                ));

        return toListResponse(role, userCountMap.getOrDefault(roleId, 0L));
    }

    /**
     * Assign, enable, or disable permissions for a role.
     *
     * For each incoming {@link PermissionEntry}:
     * <ul>
     *   <li>If a role_permission row already exists → update the enabled flag</li>
     *   <li>If no row exists → create a new role_permission entry</li>
     * </ul>
     */
    @Transactional(transactionManager = "authTransactionManager")
    public RoleDetailResponse assignPermissions(Integer roleId,
                                                AssignPermissionsRequest request,
                                                Integer actorAccountId,
                                                String ipAddress,
                                                String userAgent) {

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", roleId));

        // Prevent modification of system role permissions
        requireNonSystemRole(role);

        // Snapshot old permissions for audit
        List<RolePermission> oldRps = rolePermissionRepository.findByRoleIdWithPermission(roleId);
        Map<String, Object> oldPermSnapshot = new LinkedHashMap<>();
        oldPermSnapshot.put("roleId", roleId);
        oldPermSnapshot.put("permissions", oldRps.stream()
                .map(rp -> Map.of(
                        "permissionId", rp.getPermission().getPermissionId(),
                        "key", rp.getPermission().getKey(),
                        "enabled", rp.getEnabled()))
                .toList());

        // Validate all permission IDs exist
        Set<Integer> requestedPermIds = request.getPermissions().stream()
                .map(PermissionEntry::getPermissionId)
                .collect(Collectors.toSet());

        List<Permission> permissions = permissionRepository.findAllById(requestedPermIds);
        if (permissions.size() != requestedPermIds.size()) {
            Set<Integer> foundIds = permissions.stream()
                    .map(Permission::getPermissionId)
                    .collect(Collectors.toSet());
            Set<Integer> missing = requestedPermIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .collect(Collectors.toSet());
            throw new BusinessException("Permission IDs not found: " + missing);
        }

        // Index existing role_permissions by permissionId
        Map<Integer, RolePermission> existingMap = oldRps.stream()
                .collect(Collectors.toMap(
                        rp -> rp.getPermission().getPermissionId(),
                        rp -> rp
                ));

        // Index resolved permissions by id
        Map<Integer, Permission> permissionMap = permissions.stream()
                .collect(Collectors.toMap(Permission::getPermissionId, p -> p));

        // Upsert
        for (PermissionEntry entry : request.getPermissions()) {
            RolePermission existing = existingMap.get(entry.getPermissionId());
            if (existing != null) {
                // Update enabled flag
                existing.setEnabled(entry.getEnabled());
                rolePermissionRepository.save(existing);
            } else {
                // Create new
                RolePermission rp = new RolePermission();
                rp.setRole(role);
                rp.setPermission(permissionMap.get(entry.getPermissionId()));
                rp.setEnabled(entry.getEnabled());
                rolePermissionRepository.save(rp);
            }
        }

        rolePermissionRepository.flush();

        // Snapshot new permissions for audit
        List<RolePermission> newRps = rolePermissionRepository.findByRoleIdWithPermission(roleId);
        Map<String, Object> newPermSnapshot = new LinkedHashMap<>();
        newPermSnapshot.put("roleId", roleId);
        newPermSnapshot.put("permissions", newRps.stream()
                .map(rp -> Map.of(
                        "permissionId", rp.getPermission().getPermissionId(),
                        "key", rp.getPermission().getKey(),
                        "enabled", rp.getEnabled()))
                .toList());
        newPermSnapshot.put("result", "SUCCESS");

        auditLogService.log(actorAccountId, "PERMISSION_ASSIGN", "role",
                roleId.toString(), oldPermSnapshot,
                newPermSnapshot, ipAddress, userAgent);

        log.info("Permissions assigned to roleId={} ({} entries) by actor={}",
                roleId, request.getPermissions().size(), actorAccountId);

        // Return refreshed detail
        return getRole(roleId);
    }

    // ===================================================================
    //  Guards
    // ===================================================================

    private void requireNonSystemRole(Role role) {
        if (SYSTEM_ROLE_CODES.contains(role.getCode())) {
            throw new BusinessException(
                    "System role '" + role.getCode() + "' cannot be modified through the API");
        }
    }

    // ===================================================================
    //  Mapping helpers
    // ===================================================================

    /** Map to list-level response (no permissions, includes userCount). */
    private RoleDetailResponse toListResponse(Role role, long userCount) {
        RoleDetailResponse dto = new RoleDetailResponse();
        dto.setRoleId(role.getRoleId());
        dto.setCode(role.getCode());
        dto.setName(role.getName());
        dto.setDescription(role.getDescription());
        dto.setResponsibility(role.getResponsibility());
        dto.setCreatedAt(role.getCreatedAt());
        dto.setUpdatedAt(role.getUpdatedAt());
        dto.setUserCount((int) userCount);
        return dto;
    }

    /** Map to detail-level response (with permissions and userCount). */
    private RoleDetailResponse toDetailResponse(Role role, long userCount) {
        RoleDetailResponse dto = toListResponse(role, userCount);

        List<PermissionResponse> permResponses = role.getRolePermissions().stream()
                .map(rp -> new PermissionResponse(
                        rp.getPermission().getPermissionId(),
                        rp.getPermission().getKey(),
                        rp.getPermission().getName(),
                        rp.getEnabled()))
                .toList();
        dto.setPermissions(permResponses);

        return dto;
    }

    /** Build a JSON-friendly snapshot for audit logging. */
    private Map<String, Object> toAuditSnapshot(Role role) {
        Map<String, Object> snap = new LinkedHashMap<>();
        snap.put("roleId", role.getRoleId());
        snap.put("code", role.getCode());
        snap.put("name", role.getName());
        snap.put("description", role.getDescription());
        snap.put("responsibility", role.getResponsibility());
        return snap;
    }
}
