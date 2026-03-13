package com.companyx.synpay_dashboard.repository.auth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.auth.NotificationTemplate;

/**
 * Repository for NotificationTemplate entities.
 */
@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, Integer> {

    /**
     * Find a notification template by code.
     */
    Optional<NotificationTemplate> findByCode(String code);
}
