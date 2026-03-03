package com.companyx.synpay_dashboard.repository.auth;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.auth.Account;

@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {

    Optional<Account> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT DISTINCT a FROM Account a " +
           "LEFT JOIN FETCH a.accountRoles ar " +
           "LEFT JOIN FETCH ar.role " +
           "ORDER BY a.accountId ASC")
    List<Account> findAllWithRoles();

    @Query("SELECT DISTINCT a FROM Account a " +
           "LEFT JOIN FETCH a.accountRoles ar " +
           "LEFT JOIN FETCH ar.role " +
           "WHERE a.accountId = :id")
    Optional<Account> findByIdWithRoles(@Param("id") Integer id);

    Optional<Account> findByEmployeeId(Integer employeeId);
}
