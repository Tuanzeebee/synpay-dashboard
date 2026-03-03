package com.companyx.synpay_dashboard.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AssignPermissionsRequest {

    @NotNull(message = "Permissions list is required")
    @Size(min = 1, message = "At least one permission entry is required")
    @Valid
    private List<PermissionEntry> permissions;

    public List<PermissionEntry> getPermissions() { return permissions; }
    public void setPermissions(List<PermissionEntry> permissions) { this.permissions = permissions; }

    public static class PermissionEntry {

        @NotNull(message = "Permission ID is required")
        private Integer permissionId;

        @NotNull(message = "Enabled flag is required")
        private Boolean enabled;

        public PermissionEntry() {}

        public PermissionEntry(Integer permissionId, Boolean enabled) {
            this.permissionId = permissionId;
            this.enabled = enabled;
        }

        public Integer getPermissionId() { return permissionId; }
        public void setPermissionId(Integer permissionId) { this.permissionId = permissionId; }

        public Boolean getEnabled() { return enabled; }
        public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    }
}
