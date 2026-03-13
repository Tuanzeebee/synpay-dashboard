package com.companyx.synpay_dashboard.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.entity.auth.Account;
import com.companyx.synpay_dashboard.entity.auth.AlertRule;
import com.companyx.synpay_dashboard.entity.auth.NotificationTemplate;
import com.companyx.synpay_dashboard.entity.auth.NotificationTemplate.NotificationChannel;
import com.companyx.synpay_dashboard.repository.auth.AccountRepository;
import com.companyx.synpay_dashboard.repository.auth.AlertRuleRepository;
import com.companyx.synpay_dashboard.repository.auth.NotificationTemplateRepository;

/**
 * Service for handling notification event triggering logic.
 * 
 * Coordinates:
 * 1. Alert rule lookup by trigger event
 * 2. Recipient resolution (by role, by account relation, fallback to admin)
 * 3. Notification and email queue creation
 * 4. Audit logging (caller's responsibility)
 */
@Service
public class AlertService {

    private final AlertRuleRepository alertRuleRepository;
    private final NotificationTemplateRepository templateRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final AccountRepository accountRepository;

    public AlertService(AlertRuleRepository alertRuleRepository,
                       NotificationTemplateRepository templateRepository,
                       NotificationService notificationService,
                       EmailService emailService,
                       AccountRepository accountRepository) {
        this.alertRuleRepository = alertRuleRepository;
        this.templateRepository = templateRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.accountRepository = accountRepository;
    }

    /**
     * Trigger notification event with recipient resolution.
     * 
     * Logic:
     * 1. Find enabled alert_rule for trigger_event
     * 2. Resolve recipient accounts (from context_data)
     * 3. Create notification per account
     * 4. Enqueue email if channel is EMAIL or BOTH
     * 5. Caller must audit-log this action
     */
    @Transactional
    public void triggerEvent(String triggerEvent, Map<String, Object> contextData) {
        // Find enabled alert rule
        List<AlertRule> rules = alertRuleRepository.findByTriggerEventAndEnabledTrue(triggerEvent);
        if (rules.isEmpty()) {
            return; // No enabled alert rule for this event
        }

        AlertRule rule = rules.get(0); // Use first matching rule

        // Resolve recipients from context_data
        List<Integer> recipientAccountIds = resolveRecipients(contextData);

        if (recipientAccountIds.isEmpty()) {
            return; // No recipients to notify
        }

        // Find the notification template
        NotificationTemplate template = templateRepository.findByCode(triggerEvent)
                .orElse(createDefaultTemplate(triggerEvent));

        // Create notification per recipient account
        for (Integer accountId : recipientAccountIds) {
            Account account = accountRepository.findById(accountId).orElse(null);
            if (account == null) {
                continue; // Skip invalid accounts
            }

            // Create in-app notification
            if (rule.getNotifyChannel() != NotificationChannel.EMAIL) {
                notificationService.createNotificationWithResource(
                        account,
                        triggerEvent,
                        template.getTitle(),
                        template.getContent(),
                        (String) contextData.getOrDefault("related_resource", null),
                        (String) contextData.getOrDefault("related_resource_id", null)
                );
            }

            // Enqueue email
            if (rule.getNotifyChannel() != NotificationChannel.IN_APP) {
                String emailBody = interpolateTemplate(template.getContent(), contextData);
                emailService.enqueueEmail(
                        account.getEmail(),
                        template.getTitle(),
                        emailBody
                );
            }
        }
    }

    /**
     * Resolve recipient account IDs from context data.
     * 
     * Strategies:
     * 1. If "recipient_account_ids" in contextData, use them
     * 2. If "recipient_role_code" in contextData, find accounts with that role
     * 3. If "recipient_employee_id" in contextData, find account for that employee
     * 4. Fallback to admins
     */
    private List<Integer> resolveRecipients(Map<String, Object> contextData) {
        // Strategy 1: Direct account IDs
        if (contextData.containsKey("recipient_account_ids")) {
            @SuppressWarnings("unchecked")
            List<Integer> accountIds = (List<Integer>) contextData.get("recipient_account_ids");
            return accountIds;
        }

        // Strategy 2: By role (would need a role lookup, simplified for now)
        if (contextData.containsKey("recipient_role_code")) {
            // This would require a RoleRepository and AccountRoleRepository join
            // Simplified: return empty for now
            return List.of();
        }

        // Strategy 3: By employee ID
        if (contextData.containsKey("recipient_employee_id")) {
            Integer employeeId = ((Number) contextData.get("recipient_employee_id")).intValue();
            var account = accountRepository.findByEmployeeId(employeeId);
            if (account.isPresent()) {
                return List.of(account.get().getAccountId());
            }
        }

        // Fallback: Return empty (or could return all admin accounts)
        return List.of();
    }

    /**
     * Create a default notification template if not found.
     * This is a fallback for undefined event types.
     */
    private NotificationTemplate createDefaultTemplate(String eventCode) {
        return new NotificationTemplate(
                eventCode,
                "System Notification: " + eventCode,
                "An important system event has occurred: " + eventCode,
                NotificationChannel.IN_APP
        );
    }

    /**
     * Simple template interpolation (very basic, can be enhanced).
     * Replaces {{key}} with value from contextData.
     */
    private String interpolateTemplate(String template, Map<String, Object> contextData) {
        String result = template;
        for (Map.Entry<String, Object> entry : contextData.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue().toString() : "";
            result = result.replace(placeholder, value);
        }
        return result;
    }

    /**
     * Get all enabled alert rules.
     */
    public List<AlertRule> getEnabledRules() {
        return alertRuleRepository.findByEnabledTrue();
    }
}
