package com.companyx.synpay_dashboard.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateRoleRequest {

    @NotBlank(message = "Role code is required")
    @Size(max = 80, message = "Role code must not exceed 80 characters")
    private String code;

    @NotBlank(message = "Role name is required")
    @Size(max = 150, message = "Role name must not exceed 150 characters")
    private String name;

    private String description;

    private String responsibility;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getResponsibility() { return responsibility; }
    public void setResponsibility(String responsibility) { this.responsibility = responsibility; }
}
