package com.companyx.synpay_dashboard.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.dto.response.EmailQueuePageResponse;
import com.companyx.synpay_dashboard.dto.response.EmailQueueResponse;
import com.companyx.synpay_dashboard.entity.auth.EmailQueue;
import com.companyx.synpay_dashboard.entity.auth.EmailQueue.EmailStatus;
import com.companyx.synpay_dashboard.repository.auth.EmailQueueRepository;

/**
 * Service for managing async email delivery queue.
 * 
 * Email sending is async:
 * - Notifications can trigger email queue entries
 * - Failed emails are tracked with retry_count and last_error
 * - Admin can retry failed emails manually
 */
@Service
public class EmailService {

    private final EmailQueueRepository emailQueueRepository;

    public EmailService(EmailQueueRepository emailQueueRepository) {
        this.emailQueueRepository = emailQueueRepository;
    }

    /**
     * Enqueue an email for async delivery.
     */
    @Transactional
    public EmailQueue enqueueEmail(String toEmail, String subject, String body) {
        EmailQueue email = new EmailQueue(toEmail, subject, body);
        return emailQueueRepository.save(email);
    }

    /**
     * Get paginated email queue by status.
     */
    @Transactional(readOnly = true)
    public EmailQueuePageResponse getEmailsByStatus(String status, Integer page, Integer size) {
        EmailStatus emailStatus = EmailStatus.valueOf(status.toUpperCase());
        Pageable pageable = PageRequest.of(page, Math.min(size, 100)); // Max 100 per page
        Page<EmailQueue> pageResult = emailQueueRepository.findByStatusOrderByCreatedAtDesc(emailStatus, pageable);

        var content = pageResult.getContent()
                .stream()
                .map(this::toEmailQueueResponse)
                .toList();

        return new EmailQueuePageResponse(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    /**
     * Get a specific email queue entry.
     */
    @Transactional(readOnly = true)
    public EmailQueue getEmail(Long emailId) {
        return emailQueueRepository.findById(emailId)
                .orElseThrow(() -> new IllegalArgumentException("Email not found: " + emailId));
    }

    /**
     * Mark an email as sent.
     */
    @Transactional
    public EmailQueue markAsSent(Long emailId) {
        EmailQueue email = getEmail(emailId);
        email.setStatus(EmailStatus.SENT);
        email.setSentAt(LocalDateTime.now());
        email.setLastError(null); // Clear any previous error
        return emailQueueRepository.save(email);
    }

    /**
     * Mark an email as failed and record the error.
     */
    @Transactional
    public EmailQueue markAsFailed(Long emailId, String errorMessage) {
        EmailQueue email = getEmail(emailId);
        email.setStatus(EmailStatus.FAILED);
        email.setLastError(errorMessage);
        return emailQueueRepository.save(email);
    }

    /**
     * Increment retry count for a failed email.
     */
    @Transactional
    public EmailQueue incrementRetryCount(Long emailId) {
        EmailQueue email = getEmail(emailId);
        email.setRetryCount((email.getRetryCount() != null ? email.getRetryCount() : 0) + 1);
        return emailQueueRepository.save(email);
    }

    /**
     * Reset a failed email to PENDING for retry.
     * Can only reset FAILED emails.
     */
    @Transactional
    public EmailQueue retryFailedEmail(Long emailId) {
        EmailQueue email = getEmail(emailId);

        if (!email.getStatus().equals(EmailStatus.FAILED)) {
            throw new IllegalArgumentException("Only FAILED emails can be retried: " + emailId);
        }

        email.setStatus(EmailStatus.PENDING);
        email.setRetryCount(0);
        email.setLastError(null);
        return emailQueueRepository.save(email);
    }

    /**
     * Convert EmailQueue entity to response DTO.
     */
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
