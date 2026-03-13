package com.companyx.synpay_dashboard.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response DTO for a single notification.
 */
public class NotificationResponse {

    @JsonProperty("notification_id")
    private Long notificationId;

    @JsonProperty("template_code")
    private String templateCode;

    private String title;

    private String message;

    @JsonProperty("is_read")
    private Boolean isRead;

    @JsonProperty("related_resource")
    private String relatedResource;

    @JsonProperty("related_resource_id")
    private String relatedResourceId;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    public NotificationResponse() {
    }

    public NotificationResponse(Long notificationId, String templateCode, String title,
            String message, Boolean isRead, String relatedResource, 
            String relatedResourceId, LocalDateTime createdAt) {
        this.notificationId = notificationId;
        this.templateCode = templateCode;
        this.title = title;
        this.message = message;
        this.isRead = isRead;
        this.relatedResource = relatedResource;
        this.relatedResourceId = relatedResourceId;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }

    public String getTemplateCode() {
        return templateCode;
    }

    public void setTemplateCode(String templateCode) {
        this.templateCode = templateCode;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public String getRelatedResource() {
        return relatedResource;
    }

    public void setRelatedResource(String relatedResource) {
        this.relatedResource = relatedResource;
    }

    public String getRelatedResourceId() {
        return relatedResourceId;
    }

    public void setRelatedResourceId(String relatedResourceId) {
        this.relatedResourceId = relatedResourceId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
