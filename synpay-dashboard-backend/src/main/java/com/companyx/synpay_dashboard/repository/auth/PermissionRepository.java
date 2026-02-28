package com.companyx.synpay_dashboard.repository.auth;

import com.companyx.synpay_dashboard.entity.auth.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Integer> {

    /**
     * Resolves all enabled permission keys for a given account by joining
     * account_role → role_permission → permission.
     */
    @Query(value = "SELECT DISTINCT p.`key` FROM account_role ar " +
                   "INNER JOIN role_permission rp ON ar.role_id = rp.role_id AND rp.enabled = 1 " +
                   "INNER JOIN permission p ON rp.permission_id = p.permission_id " +
                   "WHERE ar.account_id = :accountId",
           nativeQuery = true)
    List<String> findEnabledPermissionKeysByAccountId(@Param("accountId") Integer accountId);
}
