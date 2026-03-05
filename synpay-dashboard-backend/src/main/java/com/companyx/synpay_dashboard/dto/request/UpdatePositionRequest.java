package com.companyx.synpay_dashboard.dto.request;

import jakarta.validation.constraints.Size;

public class UpdatePositionRequest {

    @Size(max = 100, message = "Position name must not exceed 100 characters")
    private String positionName;

    public String getPositionName() { return positionName; }
    public void setPositionName(String positionName) { this.positionName = positionName; }
}
