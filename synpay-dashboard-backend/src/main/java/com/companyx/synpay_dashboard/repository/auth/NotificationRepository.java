package com.companyx.synpay_dashboard.repository.auth;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.auth.Notification;

/**
 * Repository for Notification entities.
 * 
 * Supports paginated queries by account and read status.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Find all notifications for a specific account, paginated.
     */
    Page<Notification> findByAccountAccountIdOrderByCreatedAtDesc(Integer accountId, Pageable pageable);

    /**
     * Find unread notifications for a specific account.
     */
    List<Notification> findByAccountAccountIdAndIsReadFalseOrderByCreatedAtDesc(Integer accountId);

    /**
     * Find notifications by account and read status, paginated.
     */
    Page<Notification> findByAccountAccountIdAndIsReadOrderByCreatedAtDesc(
            Integer accountId, Boolean isRead, Pageable pageable);

    /**
     * Count unread notifications for a specific account.
     */
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.account.accountId = :accountId AND n.isRead = false")
    long countUnreadByAccountId(@Param("accountId") Integer accountId);
}
