package com.companyx.synpay_dashboard.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Single audit log entry returned by the API.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuditLogResponse {

    private Long id;
    private Integer actorAccountId;
    private String actorEmail;
    private String actorRole;
    private String action;
    private String resource;
    private String resourceId;
    private String actionDescription;
    private Object oldValue;
    private Object newValue;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;

    // ----- Getters & Setters -----

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Object getOldValue() { return oldValue; }
    public void setOldValue(Object oldValue) { this.oldValue = oldValue; }

    public Object getNewValue() { return newValue; }
    public void setNewValue(Object newValue) { this.newValue = newValue; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
