package com.companyx.synpay_dashboard.repository.auth;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.auth.AccountRole;

@Repository
public interface AccountRoleRepository extends JpaRepository<AccountRole, Integer> {

    List<AccountRole> findByAccountAccountId(Integer accountId);

    @Modifying
    @Query("DELETE FROM AccountRole ar WHERE ar.account.accountId = :accountId")
    void deleteAllByAccountId(@Param("accountId") Integer accountId);

    @Query("SELECT ar.role.roleId, COUNT(ar) FROM AccountRole ar GROUP BY ar.role.roleId")
    List<Object[]> countUsersGroupByRole();
}
