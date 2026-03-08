package com.companyx.synpay_dashboard.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO for {@code GET /internal/dashboard/activity}.
 * <p>
 * Provides recent security activity data from audit logs:
 * login events, role changes, and other system actions.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardActivityResponse {

    private int totalRecentActions;
    private List<ActivityItem> recentActivities;

    public static class ActivityItem {
        private Long auditId;
        private String actorEmail;
        private String actorRole;
        private String action;
        private String resource;
        private String resourceId;
        private String description;
        private String ipAddress;
        private LocalDateTime createdAt;

        public Long getAuditId() { return auditId; }
        public void setAuditId(Long auditId) { this.auditId = auditId; }

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

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getIpAddress() { return ipAddress; }
        public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    public int getTotalRecentActions() { return totalRecentActions; }
    public void setTotalRecentActions(int totalRecentActions) { this.totalRecentActions = totalRecentActions; }

    public List<ActivityItem> getRecentActivities() { return recentActivities; }
    public void setRecentActivities(List<ActivityItem> recentActivities) { this.recentActivities = recentActivities; }
}
