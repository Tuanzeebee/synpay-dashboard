package com.companyx.synpay_dashboard.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO for the Role Management API.
 *
 * Used for both list (permissions omitted) and detail (permissions included) endpoints.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RoleDetailResponse {

    private Integer roleId;
    private String code;
    private String name;
    private String description;
    private String responsibility;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer userCount;
    private List<PermissionResponse> permissions;

    public Integer getRoleId() { return roleId; }
    public void setRoleId(Integer roleId) { this.roleId = roleId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getResponsibility() { return responsibility; }
    public void setResponsibility(String responsibility) { this.responsibility = responsibility; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Integer getUserCount() { return userCount; }
    public void setUserCount(Integer userCount) { this.userCount = userCount; }

    public List<PermissionResponse> getPermissions() { return permissions; }
    public void setPermissions(List<PermissionResponse> permissions) { this.permissions = permissions; }
}
