package com.companyx.synpay_dashboard.repository.auth;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.auth.RolePermission;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Integer> {

    @Query("SELECT rp FROM RolePermission rp " +
           "JOIN FETCH rp.permission " +
           "WHERE rp.role.roleId = :roleId")
    List<RolePermission> findByRoleIdWithPermission(@Param("roleId") Integer roleId);

    @Query("SELECT rp FROM RolePermission rp " +
           "JOIN FETCH rp.permission " +
           "WHERE rp.role.roleId IN :roleIds")
    List<RolePermission> findByRoleIdsWithPermission(@Param("roleIds") List<Integer> roleIds);

    Optional<RolePermission> findByRoleRoleIdAndPermissionPermissionId(Integer roleId, Integer permissionId);

    /** Fetch all role-permission rows with both role and permission eagerly loaded (for matrix). */
    @Query("SELECT rp FROM RolePermission rp " +
           "JOIN FETCH rp.role " +
           "JOIN FETCH rp.permission")
    List<RolePermission> findAllWithRoleAndPermission();
}
