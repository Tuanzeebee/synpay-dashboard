package com.companyx.synpay_dashboard.dto.response;

/**
 * Permission projection (used in user detail views).
 */
public class PermissionResponse {

    private Integer permissionId;
    private String key;
    private String name;
    private Boolean enabled;

    public PermissionResponse() {}

    public PermissionResponse(Integer permissionId, String key, String name, Boolean enabled) {
        this.permissionId = permissionId;
        this.key = key;
        this.name = name;
        this.enabled = enabled;
    }

    public Integer getPermissionId() { return permissionId; }
    public void setPermissionId(Integer permissionId) { this.permissionId = permissionId; }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
}
