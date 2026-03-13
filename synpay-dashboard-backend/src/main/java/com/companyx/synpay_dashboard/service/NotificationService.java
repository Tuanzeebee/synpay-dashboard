package com.companyx.synpay_dashboard.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.dto.response.NotificationPageResponse;
import com.companyx.synpay_dashboard.dto.response.NotificationResponse;
import com.companyx.synpay_dashboard.entity.auth.Account;
import com.companyx.synpay_dashboard.entity.auth.Notification;
import com.companyx.synpay_dashboard.repository.auth.NotificationRepository;

/**
 * Service for managing in-app notifications.
 * 
 * Notifications are:
 * - Immutable except for is_read flag
 * - Audit-logged on creation
 * - Filtered by account ownership
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Create and save a new notification.
     * Must be audit-logged by the caller.
     */
    @Transactional
    public Notification createNotification(Account account, String templateCode,
                                          String title, String message) {
        Notification notification = new Notification(account, templateCode, title, message);
        return notificationRepository.save(notification);
    }

    /**
     * Create and save a notification with related resource information.
     */
    @Transactional
    public Notification createNotificationWithResource(Account account, String templateCode,
                                                       String title, String message,
                                                       String relatedResource, String relatedResourceId) {
        Notification notification = new Notification(account, templateCode, title, message);
        notification.setRelatedResource(relatedResource);
        notification.setRelatedResourceId(relatedResourceId);
        return notificationRepository.save(notification);
    }

    /**
     * Get paginated notifications for an account (descending by created_at).
     */
    @Transactional(readOnly = true)
    public NotificationPageResponse getNotificationsForAccount(Integer accountId, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100)); // Max 100 per page
        Page<Notification> pageResult = notificationRepository.findByAccountAccountIdOrderByCreatedAtDesc(accountId, pageable);

        List<NotificationResponse> content = pageResult.getContent()
                .stream()
                .map(this::toNotificationResponse)
                .toList();

        long unreadCount = notificationRepository.countUnreadByAccountId(accountId);

        return new NotificationPageResponse(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                unreadCount
        );
    }

    /**
     * Get paginated notifications filtered by read status.
     */
    @Transactional(readOnly = true)
    public NotificationPageResponse getNotificationsByReadStatus(Integer accountId, Boolean isRead,
                                                                  Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<Notification> pageResult = notificationRepository
                .findByAccountAccountIdAndIsReadOrderByCreatedAtDesc(accountId, isRead, pageable);

        List<NotificationResponse> content = pageResult.getContent()
                .stream()
                .map(this::toNotificationResponse)
                .toList();

        long unreadCount = notificationRepository.countUnreadByAccountId(accountId);

        return new NotificationPageResponse(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                unreadCount
        );
    }

    /**
     * Mark a notification as read (only owner can mark).
     * Must be audit-logged by the caller.
     */
    @Transactional
    public Notification markAsRead(Long notificationId, Integer ownerAccountId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));

        // Verify ownership
        if (!notification.getAccount().getAccountId().equals(ownerAccountId)) {
            throw new SecurityException("Cannot mark notification as read: not owner");
        }

        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    /**
     * Get a notification by ID (for verification/audit purposes).
     */
    @Transactional(readOnly = true)
    public Notification getNotification(Long notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
    }

    /**
     * Get all unread notifications for an account.
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotifications(Integer accountId) {
        return notificationRepository.findByAccountAccountIdAndIsReadFalseOrderByCreatedAtDesc(accountId)
                .stream()
                .map(this::toNotificationResponse)
                .toList();
    }

    /**
     * Convert Notification entity to response DTO.
     */
    private NotificationResponse toNotificationResponse(Notification notification) {
        return new NotificationResponse(
                notification.getNotificationId(),
                notification.getTemplateCode(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getIsRead(),
                notification.getRelatedResource(),
                notification.getRelatedResourceId(),
                notification.getCreatedAt()
        );
    }
}
