package com.companyx.synpay_dashboard.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for {@code POST /internal/auth/refresh}.
 */
public class RefreshRequest {

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;

    public RefreshRequest() {}

    public RefreshRequest(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
}
