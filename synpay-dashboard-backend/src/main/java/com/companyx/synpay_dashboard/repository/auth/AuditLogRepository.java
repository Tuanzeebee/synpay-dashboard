package com.companyx.synpay_dashboard.repository.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.auth.AuditLog;

/**
 * Repository for audit log entries.
 * <p>
 * Extends {@link JpaSpecificationExecutor} to support dynamic filtering /
 * pagination via Spring Data Specifications.
 */
@Repository
public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long>,
                JpaSpecificationExecutor<AuditLog> {
}
