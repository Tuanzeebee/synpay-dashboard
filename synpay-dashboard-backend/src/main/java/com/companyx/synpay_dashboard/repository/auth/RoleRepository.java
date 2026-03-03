package com.companyx.synpay_dashboard.repository.auth;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.auth.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT r FROM Role r WHERE r.roleId IN :ids")
    List<Role> findAllByIds(@Param("ids") Set<Integer> ids);

    @Query("SELECT r FROM Role r " +
           "LEFT JOIN FETCH r.rolePermissions rp " +
           "LEFT JOIN FETCH rp.permission " +
           "WHERE r.roleId = :id")
    Optional<Role> findByIdWithPermissions(@Param("id") Integer id);
}
