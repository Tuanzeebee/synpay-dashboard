package com.companyx.synpay_dashboard.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.dto.request.UpdatePermissionMatrixRequest;
import com.companyx.synpay_dashboard.dto.response.PermissionMatrixResponse;
import com.companyx.synpay_dashboard.dto.response.PermissionMatrixResponse.RolePermissionMatrix;
import com.companyx.synpay_dashboard.dto.response.PermissionSummaryResponse;
import com.companyx.synpay_dashboard.dto.response.PermissionSummaryResponse.DomainGroup;
import com.companyx.synpay_dashboard.dto.response.PermissionSummaryResponse.PermissionItem;
import com.companyx.synpay_dashboard.entity.auth.Permission;
import com.companyx.synpay_dashboard.entity.auth.Role;
import com.companyx.synpay_dashboard.entity.auth.RolePermission;
import com.companyx.synpay_dashboard.exceptions.BusinessException;
import com.companyx.synpay_dashboard.exceptions.ResourceNotFoundException;
import com.companyx.synpay_dashboard.repository.auth.PermissionRepository;
import com.companyx.synpay_dashboard.repository.auth.RolePermissionRepository;
import com.companyx.synpay_dashboard.repository.auth.RoleRepository;

/**
 * Business logic for the Permission Matrix:
 * <ul>
 *   <li>Build the full permission matrix for all roles</li>
 *   <li>Toggle individual permissions for a role</li>
 *   <li>Build per-role permission summaries grouped by domain</li>
 * </ul>
 *
 * Permission keys follow the convention {@code domain.action}
 * (e.g. "user.read", "payroll.write").
 */
@Service
public class PermissionMatrixService {

    private static final Logger log = LoggerFactory.getLogger(PermissionMatrixService.class);

    /** The separator between domain and action in a permission key. */
    private static final String KEY_SEPARATOR = ".";

    /**
     * Critical ADMIN permission keys that may not be disabled.
     * Prevents locking out the administrator.
     */
    private static final Set<String> ADMIN_CRITICAL_KEYS = Set.of(
            "user.read", "user.write",
            "role.read", "role.write",
            "permission.read", "permission.write",
            "permission.assign",
            "permission_matrix.read", "permission_matrix.write",
            "audit.read"
    );

    private static final String ADMIN_ROLE_CODE = "ADMIN";

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final AuditLogService auditLogService;

    public PermissionMatrixService(RoleRepository roleRepository,
                                   PermissionRepository permissionRepository,
                                   RolePermissionRepository rolePermissionRepository,
                                   AuditLogService auditLogService) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.auditLogService = auditLogService;
    }

    // ===================================================================
    //  GET /internal/permission-matrix
    // ===================================================================

    /**
     * Build the full permission matrix for rendering in the frontend.
     *
     * <p>Returns all domains, all actions, and each role's permission
     * map keyed by "domain.action".</p>
     */
    @Transactional(transactionManager = "authTransactionManager", readOnly = true)
    public PermissionMatrixResponse getPermissionMatrix() {
        // All permissions (defines the universe of domain × action cells)
        List<Permission> allPermissions = permissionRepository.findAll();

        // Extract unique sorted domains and actions
        TreeSet<String> domainSet = new TreeSet<>();
        TreeSet<String> actionSet = new TreeSet<>();
        for (Permission perm : allPermissions) {
            String[] parts = splitKey(perm.getKey());
            domainSet.add(parts[0]);
            actionSet.add(parts[1]);
        }

        // All roles
        List<Role> allRoles = roleRepository.findAll();

        // All role-permission rows (eager-loaded)
        List<RolePermission> allRolePermissions = rolePermissionRepository.findAllWithRoleAndPermission();

        // Build: roleId → (permissionKey → enabled)
        Map<Integer, Map<String, Boolean>> rolePermMap = new LinkedHashMap<>();
        for (RolePermission rp : allRolePermissions) {
            rolePermMap
                    .computeIfAbsent(rp.getRole().getRoleId(), k -> new LinkedHashMap<>())
                    .put(rp.getPermission().getKey(), rp.getEnabled());
        }

        // Build role matrices
        List<RolePermissionMatrix> roleMatrices = allRoles.stream()
                .map(role -> {
                    RolePermissionMatrix rpm = new RolePermissionMatrix();
                    rpm.setRoleId(role.getRoleId());
                    rpm.setCode(role.getCode());
                    rpm.setName(role.getName());
                    rpm.setPermissions(rolePermMap.getOrDefault(role.getRoleId(), Map.of()));
                    return rpm;
                })
                .toList();

        PermissionMatrixResponse response = new PermissionMatrixResponse();
        response.setDomains(new ArrayList<>(domainSet));
        response.setActions(new ArrayList<>(actionSet));
        response.setRoles(roleMatrices);

        return response;
    }

    // ===================================================================
    //  PUT /internal/permission-matrix
    // ===================================================================

    /**
     * Toggle a single permission cell in the matrix.
     *
     * <p>If the Permission row for the given domain+action does not exist,
     * it is auto-created. Then the RolePermission entry is created or updated.</p>
     */
    @Transactional(transactionManager = "authTransactionManager")
    public PermissionMatrixResponse updatePermissionMatrix(UpdatePermissionMatrixRequest request,
                                                           Integer actorAccountId,
                                                           String ipAddress,
                                                           String userAgent) {

        String domain = request.getDomain().toLowerCase().trim();
        String action = request.getAction().toLowerCase().trim();
        String permissionKey = domain + KEY_SEPARATOR + action;

        // 1. Resolve the role
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role", request.getRoleId()));

        // 2. Prevent disabling critical permissions for ADMIN
        if (ADMIN_ROLE_CODE.equals(role.getCode())
                && Boolean.FALSE.equals(request.getEnabled())
                && ADMIN_CRITICAL_KEYS.contains(permissionKey)) {
            throw new BusinessException(
                    "Cannot disable critical permission '" + permissionKey + "' for the ADMIN role");
        }

        // 3. Resolve-or-create the Permission entity
        Permission permission = permissionRepository.findByKey(permissionKey)
                .orElseGet(() -> {
                    log.info("Auto-creating permission key='{}'", permissionKey);
                    Permission p = new Permission();
                    p.setKey(permissionKey);
                    p.setName(buildPermissionName(domain, action));
                    p.setCategory(capitalise(domain));
                    return permissionRepository.saveAndFlush(p);
                });

        // 4. Snapshot old state for audit
        Optional<RolePermission> existing =
                rolePermissionRepository.findByRoleRoleIdAndPermissionPermissionId(
                        role.getRoleId(), permission.getPermissionId());

        Boolean oldEnabled = existing.map(RolePermission::getEnabled).orElse(null);

        // 5. Upsert RolePermission
        RolePermission rp;
        if (existing.isPresent()) {
            rp = existing.get();
            rp.setEnabled(request.getEnabled());
        } else {
            rp = new RolePermission();
            rp.setRole(role);
            rp.setPermission(permission);
            rp.setEnabled(request.getEnabled());
        }
        rolePermissionRepository.saveAndFlush(rp);

        // 6. Audit log
        Map<String, Object> oldSnapshot = new LinkedHashMap<>();
        oldSnapshot.put("roleId", role.getRoleId());
        oldSnapshot.put("permissionKey", permissionKey);
        oldSnapshot.put("enabled", oldEnabled);

        Map<String, Object> newSnapshot = new LinkedHashMap<>();
        newSnapshot.put("roleId", role.getRoleId());
        newSnapshot.put("permissionKey", permissionKey);
        newSnapshot.put("enabled", request.getEnabled());
        newSnapshot.put("result", "SUCCESS");

        auditLogService.log(actorAccountId, "PERMISSION_MATRIX_UPDATE", "permission_matrix",
                role.getRoleId().toString(), oldSnapshot, newSnapshot, ipAddress, userAgent);

        log.info("Permission matrix updated: role={} key={} enabled={} by actor={}",
                role.getCode(), permissionKey, request.getEnabled(), actorAccountId);

        // 7. Return refreshed full matrix
        return getPermissionMatrix();
    }

    // ===================================================================
    //  GET /internal/roles/{id}/permissions/summary
    // ===================================================================

    /**
     * Build a permission summary for a single role, grouped by domain.
     *
     * <p>Includes ALL permissions in the system — those not assigned to
     * the role are shown as {@code enabled=false}.</p>
     */
    @Transactional(transactionManager = "authTransactionManager", readOnly = true)
    public PermissionSummaryResponse getPermissionSummary(Integer roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", roleId));

        // All permissions in the system
        List<Permission> allPermissions = permissionRepository.findAll();

        // This role's assigned permissions: permissionId → enabled
        Map<Integer, Boolean> rolePermMap = rolePermissionRepository
                .findByRoleIdWithPermission(roleId)
                .stream()
                .collect(Collectors.toMap(
                        rp -> rp.getPermission().getPermissionId(),
                        RolePermission::getEnabled
                ));

        // Group all permissions by domain
        TreeMap<String, List<Permission>> domainMap = new TreeMap<>();
        for (Permission perm : allPermissions) {
            String[] parts = splitKey(perm.getKey());
            domainMap.computeIfAbsent(parts[0], k -> new ArrayList<>()).add(perm);
        }

        int totalEnabled = 0;
        List<DomainGroup> domainGroups = new ArrayList<>();

        for (Map.Entry<String, List<Permission>> entry : domainMap.entrySet()) {
            String domain = entry.getKey();
            List<Permission> perms = entry.getValue();

            int domainEnabledCount = 0;
            List<PermissionItem> items = new ArrayList<>();

            for (Permission perm : perms) {
                String[] parts = splitKey(perm.getKey());
                Boolean enabled = rolePermMap.getOrDefault(perm.getPermissionId(), false);

                PermissionItem item = new PermissionItem();
                item.setPermissionId(perm.getPermissionId());
                item.setKey(perm.getKey());
                item.setName(perm.getName());
                item.setAction(parts[1]);
                item.setEnabled(enabled);
                items.add(item);

                if (Boolean.TRUE.equals(enabled)) {
                    domainEnabledCount++;
                    totalEnabled++;
                }
            }

            DomainGroup group = new DomainGroup();
            group.setDomain(domain);
            group.setPermissions(items);
            group.setEnabledCount(domainEnabledCount);
            domainGroups.add(group);
        }

        PermissionSummaryResponse response = new PermissionSummaryResponse();
        response.setRoleId(role.getRoleId());
        response.setRoleCode(role.getCode());
        response.setRoleName(role.getName());
        response.setDomains(domainGroups);
        response.setTotalEnabled(totalEnabled);
        response.setTotalPermissions(allPermissions.size());

        return response;
    }

    // ===================================================================
    //  Helpers
    // ===================================================================

    /**
     * Split a permission key into [domain, action].
     * Falls back to ["unknown", keyValue] if no separator is found.
     */
    private String[] splitKey(String key) {
        int idx = key.indexOf(KEY_SEPARATOR);
        if (idx > 0 && idx < key.length() - 1) {
            return new String[]{ key.substring(0, idx), key.substring(idx + 1) };
        }
        return new String[]{ "unknown", key };
    }

    /** Generate a human-readable name from domain and action, e.g. "User Read". */
    private String buildPermissionName(String domain, String action) {
        return capitalise(domain) + " " + capitalise(action);
    }

    private String capitalise(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }
}
