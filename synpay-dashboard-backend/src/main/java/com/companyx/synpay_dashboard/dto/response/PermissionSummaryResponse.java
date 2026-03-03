package com.companyx.synpay_dashboard.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO for GET /internal/roles/{id}/permissions/summary.
 *
 * Groups permissions by domain for the role detail view.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PermissionSummaryResponse {

    private Integer roleId;
    private String roleCode;
    private String roleName;
    private List<DomainGroup> domains;
    private int totalEnabled;
    private int totalPermissions;

    // ----- Getters & Setters -----

    public Integer getRoleId() { return roleId; }
    public void setRoleId(Integer roleId) { this.roleId = roleId; }

    public String getRoleCode() { return roleCode; }
    public void setRoleCode(String roleCode) { this.roleCode = roleCode; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

    public List<DomainGroup> getDomains() { return domains; }
    public void setDomains(List<DomainGroup> domains) { this.domains = domains; }

    public int getTotalEnabled() { return totalEnabled; }
    public void setTotalEnabled(int totalEnabled) { this.totalEnabled = totalEnabled; }

    public int getTotalPermissions() { return totalPermissions; }
    public void setTotalPermissions(int totalPermissions) { this.totalPermissions = totalPermissions; }

    /**
     * Permissions grouped under a single domain.
     */
    public static class DomainGroup {

        private String domain;
        private List<PermissionItem> permissions;
        private int enabledCount;

        // ----- Getters & Setters -----

        public String getDomain() { return domain; }
        public void setDomain(String domain) { this.domain = domain; }

        public List<PermissionItem> getPermissions() { return permissions; }
        public void setPermissions(List<PermissionItem> permissions) { this.permissions = permissions; }

        public int getEnabledCount() { return enabledCount; }
        public void setEnabledCount(int enabledCount) { this.enabledCount = enabledCount; }
    }

    /**
     * A single permission item within a domain.
     */
    public static class PermissionItem {

        private Integer permissionId;
        private String key;
        private String name;
        private String action;
        private Boolean enabled;

        // ----- Getters & Setters -----

        public Integer getPermissionId() { return permissionId; }
        public void setPermissionId(Integer permissionId) { this.permissionId = permissionId; }

        public String getKey() { return key; }
        public void setKey(String key) { this.key = key; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }

        public Boolean getEnabled() { return enabled; }
        public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    }
}
