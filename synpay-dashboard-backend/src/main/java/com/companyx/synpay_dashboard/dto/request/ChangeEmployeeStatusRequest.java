package com.companyx.synpay_dashboard.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChangeEmployeeStatusRequest {

    @NotBlank(message = "Status is required")
    @Size(max = 50, message = "Status must not exceed 50 characters")
    private String status;

    // ----- Getters & Setters -----

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
