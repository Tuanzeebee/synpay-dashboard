package com.companyx.synpay_dashboard.entity.auth;

import java.time.LocalDateTime;

import com.companyx.synpay_dashboard.entity.auth.NotificationTemplate.NotificationChannel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Alert rule defining WHEN to trigger notifications.
 * 
 * Each alert rule references:
 * - trigger_event: Business event code (e.g., PAYROLL_APPROVED)
 * - notify_channel: Delivery channel (IN_APP, EMAIL, BOTH)
 * - enabled: Whether the rule is active
 */
@Entity
@Table(name = "alert_rule")
public class AlertRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rule_id")
    private Integer ruleId;

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "trigger_event", nullable = false, length = 100)
    private String triggerEvent;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    @Column(name = "notify_channel", nullable = false)
    @Enumerated(EnumType.STRING)
    private NotificationChannel notifyChannel = NotificationChannel.IN_APP;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public AlertRule() {
    }

    public AlertRule(String code, String triggerEvent, NotificationChannel notifyChannel) {
        this.code = code;
        this.triggerEvent = triggerEvent;
        this.notifyChannel = notifyChannel;
        this.enabled = true;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (enabled == null) {
            enabled = true;
        }
        if (notifyChannel == null) {
            notifyChannel = NotificationChannel.IN_APP;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getRuleId() {
        return ruleId;
    }

    public void setRuleId(Integer ruleId) {
        this.ruleId = ruleId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTriggerEvent() {
        return triggerEvent;
    }

    public void setTriggerEvent(String triggerEvent) {
        this.triggerEvent = triggerEvent;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public NotificationChannel getNotifyChannel() {
        return notifyChannel;
    }

    public void setNotifyChannel(NotificationChannel notifyChannel) {
        this.notifyChannel = notifyChannel;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
