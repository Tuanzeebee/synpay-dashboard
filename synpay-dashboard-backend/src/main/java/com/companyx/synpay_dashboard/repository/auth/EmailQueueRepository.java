package com.companyx.synpay_dashboard.repository.auth;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.auth.EmailQueue;
import com.companyx.synpay_dashboard.entity.auth.EmailQueue.EmailStatus;

/**
 * Repository for EmailQueue entities.
 * 
 * Supports queries by status for async email processing.
 */
@Repository
public interface EmailQueueRepository extends JpaRepository<EmailQueue, Long> {

    /**
     * Find all pending emails, paginated.
     */
    Page<EmailQueue> findByStatusOrderByCreatedAtAsc(EmailStatus status, Pageable pageable);

    /**
     * Find all emails by status, paginated.
     */
    Page<EmailQueue> findByStatusOrderByCreatedAtDesc(EmailStatus status, Pageable pageable);

    /**
     * Find all failed emails needing retry.
     */
    List<EmailQueue> findByStatusOrderByCreatedAtAsc(EmailStatus status);
}
