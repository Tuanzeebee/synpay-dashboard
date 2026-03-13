package com.companyx.synpay_dashboard.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.companyx.synpay_dashboard.dto.request.NotificationEventRequest;
import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.EmailQueuePageResponse;
import com.companyx.synpay_dashboard.dto.response.EmailQueueResponse;
import com.companyx.synpay_dashboard.dto.response.NotificationPageResponse;
import com.companyx.synpay_dashboard.dto.response.NotificationResponse;
import com.companyx.synpay_dashboard.entity.auth.EmailQueue;
import com.companyx.synpay_dashboard.entity.auth.Notification;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.companyx.synpay_dashboard.service.AlertService;
import com.companyx.synpay_dashboard.service.AuditLogService;
import com.companyx.synpay_dashboard.service.EmailService;
import com.companyx.synpay_dashboard.service.NotificationService;
import com.companyx.synpay_dashboard.service.RbacService;
import com.companyx.synpay_dashboard.utils.PermissionConstants;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Internal notification and email system endpoints.
 * 
 * All endpoints are internal-only (for backend services) and require JWT authorization.
 * RBAC is enforced per endpoint.
 * 
 * Endpoints:
 * 1. GET /internal/notifications - List notifications for current account
 * 2. PATCH /internal/notifications/{id}/read - Mark notification as read
 * 3. GET /internal/notifications/admin - View all notifications (admin only)
 * 4. POST /internal/notify/event - Trigger notification event (internal)
 * 5. GET /internal/email-queue - List email queue (admin only)
 * 6. POST /internal/email-queue/{id}/retry - Retry failed email (admin only)
 */
@RestController
@RequestMapping("/internal")
public class InternalNotificationController {

    private static final Logger log = LoggerFactory.getLogger(InternalNotificationController.class);

    private final NotificationService notificationService;
    private final EmailService emailService;
    private final AlertService alertService;
    private final RbacService rbacService;
    private final AuditLogService auditLogService;

    public InternalNotificationController(
            NotificationService notificationService,
            EmailService emailService,
            AlertService alertService,
            RbacService rbacService,
            AuditLogService auditLogService) {
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.alertService = alertService;
        this.rbacService = rbacService;
        this.auditLogService = auditLogService;
    }

    /**
     * Helper to extract client IP from request.
     */
    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Helper to get current request.
     */
    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attrs != null ? attrs.getRequest() : null;
    }

    // ===================================================================
    // 1. GET /internal/notifications
    // ===================================================================
    /**
     * List notifications for current account.
     * 
     * Query parameters:
     * - is_read: Filter by read status (optional)
     * - page: Zero-based page index (default 0)
     * - size: Page size (default 20, max 100)
     * 
     * Permission: NOTIFICATION_READ
     */
    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<NotificationPageResponse>> listNotifications(
            @RequestParam(name = "is_read", required = false) Boolean isRead,
            @RequestParam(name = "page", defaultValue = "0") Integer page,
            @RequestParam(name = "size", defaultValue = "20") Integer size) {

        try {
            GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
            Integer accountId = principal.getAccountId();

            // RBAC check
            if (!rbacService.hasPermission(accountId, PermissionConstants.NOTIFICATION_READ)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permission denied"));
            }

            NotificationPageResponse response;
            if (isRead != null) {
                response = notificationService.getNotificationsByReadStatus(accountId, isRead, page, size);
            } else {
                response = notificationService.getNotificationsForAccount(accountId, page, size);
            }

            log.info("Listed notifications for account {}: {} items, total {}", 
                    accountId, response.getContent().size(), response.getTotalElements());

            return ResponseEntity.ok(ApiResponse.success(response, "Notifications retrieved successfully"));
        } catch (Exception e) {
            log.error("Error listing notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    // ===================================================================
    // 2. PATCH /internal/notifications/{id}/read
    // ===================================================================
    /**
     * Mark a notification as read.
     * Only the owner can mark their own notification.
     * 
     * Permission: NOTIFICATION_MARK_READ
     */
    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markNotificationAsRead(
            @PathVariable("id") Long notificationId) {

        try {
            GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
            Integer accountId = principal.getAccountId();

            // RBAC check
            if (!rbacService.hasPermission(accountId, PermissionConstants.NOTIFICATION_MARK_READ)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permission denied"));
            }

            // Mark as read (check ownership internally)
            Notification notification = notificationService.markAsRead(notificationId, accountId);
            NotificationResponse response = toNotificationResponse(notification);

            // Audit log
            HttpServletRequest req = getCurrentRequest();
            String ip = req != null ? getClientIp(req) : "unknown";
            String ua = req != null ? req.getHeader("User-Agent") : null;
            auditLogService.log(accountId, "NOTIFICATION_MARK_READ", "notification", String.valueOf(notificationId),
                    null, Map.of("is_read", true), ip, ua);

            log.info("Marked notification {} as read by account {}", notificationId, accountId);

            return ResponseEntity.ok(ApiResponse.success(response, "Notification marked as read"));
        } catch (SecurityException e) {
            log.warn("Security error marking notification as read: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Cannot mark notification as read"));
        } catch (Exception e) {
            log.error("Error marking notification as read", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    // ===================================================================
    // 3. GET /internal/notifications/admin
    // ===================================================================
    /**
     * List ALL notifications (admin only).
     * 
     * Query parameters:
     * - page: Zero-based page index (default 0)
     * - size: Page size (default 20, max 100)
     * 
     * Permission: NOTIFICATION_ADMIN
     */
    @GetMapping("/notifications/admin")
    public ResponseEntity<ApiResponse<String>> listAllNotificationsAdmin(
            @RequestParam(name = "page", defaultValue = "0") Integer page,
            @RequestParam(name = "size", defaultValue = "20") Integer size) {

        try {
            GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
            Integer accountId = principal.getAccountId();

            // RBAC check
            if (!rbacService.hasPermission(accountId, PermissionConstants.NOTIFICATION_ADMIN)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permission denied"));
            }

            // For now, return a placeholder response
            // In production, implement full notification list query across all accounts
            String message = "Admin notifications view not yet implemented";
            log.info("Admin accessed all notifications view");

            return ResponseEntity.ok(ApiResponse.success(message, "Admin view - implementation pending"));
        } catch (Exception e) {
            log.error("Error listing all notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    // ===================================================================
    // 4. POST /internal/notify/event
    // ===================================================================
    /**
     * Trigger a notification event (internal-only endpoint).
     * 
     * This is called by other backend services when business events occur.
     * Logic:
     * 1. Find enabled alert_rule for trigger_event
     * 2. Resolve recipient accounts
     * 3. Create notification and email queue entries
     * 4. Audit log the action
     * 
     * No external permission check (internal only).
     */
    @PostMapping("/notify/event")
    public ResponseEntity<ApiResponse<String>> triggerNotificationEvent(
            @RequestBody NotificationEventRequest request) {

        try {
            if (request.getTriggerEvent() == null || request.getTriggerEvent().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("trigger_event is required"));
            }

            GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
            Integer actorAccountId = principal.getAccountId();

            // Trigger the event
            alertService.triggerEvent(request.getTriggerEvent(), request.getContextData());

            // Audit log
            HttpServletRequest req = getCurrentRequest();
            String ip = req != null ? getClientIp(req) : "unknown";
            String ua = req != null ? req.getHeader("User-Agent") : null;
            auditLogService.log(actorAccountId, "NOTIFICATION_EVENT_TRIGGERED", "event", 
                    request.getTriggerEvent(),
                    null,
                    Map.of("trigger_event", request.getTriggerEvent(),
                           "context_data", request.getContextData() != null ? request.getContextData() : Map.of()),
                    ip, ua
            );

            log.info("Triggered notification event {} by account {}", request.getTriggerEvent(), actorAccountId);

            return ResponseEntity.ok(ApiResponse.success(
                    "Event triggered successfully",
                    "Notification event processed"
            ));
        } catch (Exception e) {
            log.error("Error triggering notification event", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    // ===================================================================
    // 5. GET /internal/email-queue
    // ===================================================================
    /**
     * List email queue entries (admin only).
     * 
     * Query parameters:
     * - status: Filter by status (PENDING, SENT, FAILED) - required
     * - page: Zero-based page index (default 0)
     * - size: Page size (default 20, max 100)
     * 
     * Permission: EMAIL_QUEUE_VIEW
     */
    @GetMapping("/email-queue")
    public ResponseEntity<ApiResponse<EmailQueuePageResponse>> listEmailQueue(
            @RequestParam(name = "status", defaultValue = "PENDING") String status,
            @RequestParam(name = "page", defaultValue = "0") Integer page,
            @RequestParam(name = "size", defaultValue = "20") Integer size) {

        try {
            GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
            Integer accountId = principal.getAccountId();

            // RBAC check
            if (!rbacService.hasPermission(accountId, PermissionConstants.EMAIL_QUEUE_VIEW)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permission denied"));
            }

            EmailQueuePageResponse response = emailService.getEmailsByStatus(status, page, size);

            log.info("Listed email queue with status {} by account {}: {} items", 
                    status, accountId, response.getContent().size());

            return ResponseEntity.ok(ApiResponse.success(response, "Email queue retrieved successfully"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid email status: {}", status);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Invalid status: must be PENDING, SENT, or FAILED"));
        } catch (Exception e) {
            log.error("Error listing email queue", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    // ===================================================================
    // 6. POST /internal/email-queue/{id}/retry
    // ===================================================================
    /**
     * Retry a failed email (reset to PENDING).
     * Can only retry FAILED emails.
     * 
     * Permission: EMAIL_QUEUE_VIEW
     */
    @PostMapping("/email-queue/{id}/retry")
    public ResponseEntity<ApiResponse<EmailQueueResponse>> retryFailedEmail(
            @PathVariable("id") Long emailId) {

        try {
            GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
            Integer accountId = principal.getAccountId();

            // RBAC check
            if (!rbacService.hasPermission(accountId, PermissionConstants.EMAIL_QUEUE_VIEW)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Permission denied"));
            }

            // Retry the email
            EmailQueue email = emailService.retryFailedEmail(emailId);
            EmailQueueResponse response = toEmailQueueResponse(email);

            // Audit log
            HttpServletRequest req = getCurrentRequest();
            String ip = req != null ? getClientIp(req) : "unknown";
            String ua = req != null ? req.getHeader("User-Agent") : null;
            auditLogService.log(accountId, "EMAIL_RETRY", "email_queue", String.valueOf(emailId),
                    Map.of("status", "FAILED"), Map.of("status", "PENDING"), ip, ua);

            log.info("Retried email {} by account {}", emailId, accountId);

            return ResponseEntity.ok(ApiResponse.success(response, "Email queued for retry"));
        } catch (IllegalArgumentException e) {
            log.warn("Error retrying email: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error retrying email", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    // ===================================================================
    // Helper methods for DTO conversion
    // ===================================================================

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

    private EmailQueueResponse toEmailQueueResponse(EmailQueue email) {
        return new EmailQueueResponse(
                email.getEmailId(),
                email.getToEmail(),
                email.getSubject(),
                email.getBody(),
                email.getStatus().toString(),
                email.getRetryCount(),
                email.getLastError(),
                email.getCreatedAt(),
                email.getSentAt()
        );
    }
}
