package com.companyx.synpay_dashboard.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Full projection returned by GET /internal/users/{id} and write operations.
 * Includes role + permission details.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDetailResponse {

    private Integer accountId;
    private String email;
    private Integer employeeId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
    private LocalDateTime lastLogoutAt;
    private List<RoleDetailResponse> roles;

    // ----- Getters & Setters -----

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Integer getEmployeeId() { return employeeId; }
    public void setEmployeeId(Integer employeeId) { this.employeeId = employeeId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public LocalDateTime getLastLogoutAt() { return lastLogoutAt; }
    public void setLastLogoutAt(LocalDateTime lastLogoutAt) { this.lastLogoutAt = lastLogoutAt; }

    public List<RoleDetailResponse> getRoles() { return roles; }
    public void setRoles(List<RoleDetailResponse> roles) { this.roles = roles; }

    /**
     * Role with its resolved permissions — used only in the detail view.
     */
    public static class RoleDetailResponse {
        private Integer roleId;
        private String code;
        private String name;
        private List<PermissionResponse> permissions;

        public Integer getRoleId() { return roleId; }
        public void setRoleId(Integer roleId) { this.roleId = roleId; }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public List<PermissionResponse> getPermissions() { return permissions; }
        public void setPermissions(List<PermissionResponse> permissions) { this.permissions = permissions; }
    }
}
