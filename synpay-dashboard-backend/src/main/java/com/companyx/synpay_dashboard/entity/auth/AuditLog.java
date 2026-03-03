package com.companyx.synpay_dashboard.entity.auth;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * JPA entity mapped to the {@code audit_log} table in auth_db.
 *
 * <p>Audit logs are <strong>immutable and append-only</strong>.
 * Once written, they must never be updated or deleted.</p>
 */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long auditId;

    @Column(name = "actor_account_id", nullable = false)
    private Integer actorAccountId;

    @Column(name = "actor_email")
    private String actorEmail;

    @Column(name = "actor_role", length = 80)
    private String actorRole;

    /** Action verb — e.g. LOGIN_SUCCESS, ROLE_CREATE, PERMISSION_MATRIX_UPDATE. */
    @Column(name = "action", nullable = false, length = 50)
    private String action;

    /** Target resource type — e.g. "account", "user", "role". */
    @Column(name = "resource", nullable = false, length = 100)
    private String resource;

    @Column(name = "resource_id", length = 100)
    private String resourceId;

    /** Human-readable description of the action. */
    @Column(name = "action_description", columnDefinition = "text")
    private String actionDescription;

    @Column(name = "old_value", columnDefinition = "json")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "json")
    private String newValue;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ----- Getters & Setters -----

    public Long getAuditId() { return auditId; }
    public void setAuditId(Long auditId) { this.auditId = auditId; }

    public Integer getActorAccountId() { return actorAccountId; }
    public void setActorAccountId(Integer actorAccountId) { this.actorAccountId = actorAccountId; }

    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }

    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getResource() { return resource; }
    public void setResource(String resource) { this.resource = resource; }

    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }

    public String getActionDescription() { return actionDescription; }
    public void setActionDescription(String actionDescription) { this.actionDescription = actionDescription; }

    public String getOldValue() { return oldValue; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }

    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
