package com.companyx.synpay_dashboard.dto.response;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO for GET /internal/permission-matrix.
 *
 * Designed for rendering a matrix table in the frontend:
 * - rows = domains, columns = actions
 * - each role has a map of "domain.action" → enabled
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PermissionMatrixResponse {

    /** Sorted list of unique permission domains (e.g. "user", "role", "payroll"). */
    private List<String> domains;

    /** Sorted list of unique permission actions (e.g. "read", "write"). */
    private List<String> actions;

    /** All roles with their permission state for the matrix. */
    private List<RolePermissionMatrix> roles;

    // ----- Getters & Setters -----

    public List<String> getDomains() { return domains; }
    public void setDomains(List<String> domains) { this.domains = domains; }

    public List<String> getActions() { return actions; }
    public void setActions(List<String> actions) { this.actions = actions; }

    public List<RolePermissionMatrix> getRoles() { return roles; }
    public void setRoles(List<RolePermissionMatrix> roles) { this.roles = roles; }

    /**
     * A single role's permission matrix data.
     */
    public static class RolePermissionMatrix {

        private Integer roleId;
        private String code;
        private String name;

        /**
         * Keyed by "domain.action" (e.g. "user.read") → enabled boolean.
         * If no entry exists for a domain+action combo, it is treated as disabled.
         */
        private Map<String, Boolean> permissions;

        // ----- Getters & Setters -----

        public Integer getRoleId() { return roleId; }
        public void setRoleId(Integer roleId) { this.roleId = roleId; }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public Map<String, Boolean> getPermissions() { return permissions; }
        public void setPermissions(Map<String, Boolean> permissions) { this.permissions = permissions; }
    }
}
