package com.companyx.synpay_dashboard.repository.auth;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.auth.AlertRule;

/**
 * Repository for AlertRule entities.
 */
@Repository
public interface AlertRuleRepository extends JpaRepository<AlertRule, Integer> {

    /**
     * Find alert rule by code.
     */
    Optional<AlertRule> findByCode(String code);

    /**
     * Find alert rule by trigger event.
     */
    Optional<AlertRule> findByTriggerEvent(String triggerEvent);

    /**
     * Find all enabled alert rules.
     */
    List<AlertRule> findByEnabledTrue();

    /**
     * Find all enabled alert rules by trigger event.
     */
    List<AlertRule> findByTriggerEventAndEnabledTrue(String triggerEvent);
}
