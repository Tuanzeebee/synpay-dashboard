package com.companyx.synpay_dashboard.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for PUT /internal/permission-matrix.
 *
 * Toggles a single permission (domain + action) for a given role.
 */
public class UpdatePermissionMatrixRequest {

    @NotNull(message = "roleId is required")
    private Integer roleId;

    @NotBlank(message = "domain is required")
    @Size(max = 80, message = "domain must be at most 80 characters")
    private String domain;

    @NotBlank(message = "action is required")
    @Size(max = 80, message = "action must be at most 80 characters")
    private String action;

    @NotNull(message = "enabled is required")
    private Boolean enabled;

    // ----- Getters & Setters -----

    public Integer getRoleId() { return roleId; }
    public void setRoleId(Integer roleId) { this.roleId = roleId; }

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
}
