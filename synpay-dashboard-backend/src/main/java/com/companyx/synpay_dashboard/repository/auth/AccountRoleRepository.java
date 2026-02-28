package com.companyx.synpay_dashboard.repository.auth;

import com.companyx.synpay_dashboard.entity.auth.AccountRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountRoleRepository extends JpaRepository<AccountRole, Integer> {

    List<AccountRole> findByAccountAccountId(Integer accountId);

    @Modifying
    @Query("DELETE FROM AccountRole ar WHERE ar.account.accountId = :accountId")
    void deleteAllByAccountId(@Param("accountId") Integer accountId);
}
