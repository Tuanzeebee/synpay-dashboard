package com.companyx.synpay_dashboard.repository.auth;

import com.companyx.synpay_dashboard.entity.auth.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByCode(String code);

    @Query("SELECT r FROM Role r WHERE r.roleId IN :ids")
    List<Role> findAllByIds(@Param("ids") Set<Integer> ids);
}
