package com.companyx.synpay_dashboard.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Shared request body for activating / deactivating
 * a Department or Position.
 */
public class StatusChangeRequest {

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "ACTIVE|INACTIVE", message = "Status must be ACTIVE or INACTIVE")
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
