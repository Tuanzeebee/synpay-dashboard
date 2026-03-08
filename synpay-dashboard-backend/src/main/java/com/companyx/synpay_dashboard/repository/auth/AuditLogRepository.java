package com.companyx.synpay_dashboard.repository.auth;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    // ── Dashboard aggregate queries ──────────────────────────────

    /** Most recent audit log entries, ordered by creation time descending. */
    @Query("SELECT a FROM AuditLog a ORDER BY a.createdAt DESC")
    List<AuditLog> findRecent(Pageable pageable);

    /** Count of audit log entries created after a given timestamp. */
    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.createdAt >= :since")
    long countSince(@Param("since") LocalDateTime since);
}
