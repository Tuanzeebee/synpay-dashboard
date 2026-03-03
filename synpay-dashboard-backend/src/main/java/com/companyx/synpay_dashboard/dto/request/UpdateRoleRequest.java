package com.companyx.synpay_dashboard.dto.request;

import jakarta.validation.constraints.Size;

public class UpdateRoleRequest {

    @Size(max = 150, message = "Role name must not exceed 150 characters")
    private String name;

    private String description;

    private String responsibility;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getResponsibility() { return responsibility; }
    public void setResponsibility(String responsibility) { this.responsibility = responsibility; }
}
