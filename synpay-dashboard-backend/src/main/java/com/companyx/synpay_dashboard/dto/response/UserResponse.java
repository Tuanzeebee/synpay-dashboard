package com.companyx.synpay_dashboard.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Summary projection returned by GET /internal/users (list).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {

    private Integer accountId;
    private String email;
    private Integer employeeId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    private List<RoleResponse> roles;

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

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public List<RoleResponse> getRoles() { return roles; }
    public void setRoles(List<RoleResponse> roles) { this.roles = roles; }
}
