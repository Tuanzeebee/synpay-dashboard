package com.companyx.synpay_dashboard.dto.response;

/**
 * Lightweight role projection (used in list views).
 */
public class RoleResponse {

    private Integer roleId;
    private String code;
    private String name;

    public RoleResponse() {}

    public RoleResponse(Integer roleId, String code, String name) {
        this.roleId = roleId;
        this.code = code;
        this.name = name;
    }

    public Integer getRoleId() { return roleId; }
    public void setRoleId(Integer roleId) { this.roleId = roleId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
