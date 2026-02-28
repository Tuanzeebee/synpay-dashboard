package com.companyx.synpay_dashboard.service;

import com.companyx.synpay_dashboard.exceptions.AccessDeniedException;
import com.companyx.synpay_dashboard.repository.auth.PermissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Resolves and enforces RBAC by looking up the effective permissions of
 * a given account in the auth_db.
 * <p>
 * Resolution path: account → account_role → role_permission (enabled) → permission.key
 */
@Service
public class RbacService {

    private static final Logger log = LoggerFactory.getLogger(RbacService.class);

    private final PermissionRepository permissionRepository;

    public RbacService(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    /**
     * Checks whether {@code accountId} holds the given permission key.
     *
     * @throws AccessDeniedException if the permission is missing
     */
    @Transactional(transactionManager = "authTransactionManager", readOnly = true)
    public void requirePermission(Integer accountId, String permissionKey) {
        List<String> keys = permissionRepository.findEnabledPermissionKeysByAccountId(accountId);
        if (!keys.contains(permissionKey)) {
            log.warn("RBAC denied – account {} lacks permission '{}'", accountId, permissionKey);
            throw new AccessDeniedException(
                    "You do not have the required permission: " + permissionKey);
        }
        log.debug("RBAC granted – account {} has permission '{}'", accountId, permissionKey);
    }

    /**
     * Returns {@code true} if the account holds the given permission.
     */
    @Transactional(transactionManager = "authTransactionManager", readOnly = true)
    public boolean hasPermission(Integer accountId, String permissionKey) {
        return permissionRepository
                .findEnabledPermissionKeysByAccountId(accountId)
                .contains(permissionKey);
    }
}
