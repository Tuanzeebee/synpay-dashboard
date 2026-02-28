package com.companyx.synpay_dashboard.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response body for a successful {@code POST /internal/auth/login}.
 * <p>
 * Contains the JWT access token and the resolved identity &amp; RBAC data
 * so the API Gateway can cache them without a second round-trip.
 */
public class LoginResponse {

    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("token_type")
    private String tokenType = "Bearer";

    @JsonProperty("expires_in")
    private long expiresIn;

    @JsonProperty("account_id")
    private Integer accountId;

    private String role;

    @JsonProperty("employee_id")
    private Integer employeeId;

    private List<String> permissions;

    public LoginResponse() {}

    // ----- Builder-style setters -----

    public LoginResponse accessToken(String accessToken) {
        this.accessToken = accessToken;
        return this;
    }

    public LoginResponse tokenType(String tokenType) {
        this.tokenType = tokenType;
        return this;
    }

    public LoginResponse expiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
        return this;
    }

    public LoginResponse accountId(Integer accountId) {
        this.accountId = accountId;
        return this;
    }

    public LoginResponse role(String role) {
        this.role = role;
        return this;
    }

    public LoginResponse employeeId(Integer employeeId) {
        this.employeeId = employeeId;
        return this;
    }

    public LoginResponse permissions(List<String> permissions) {
        this.permissions = permissions;
        return this;
    }

    // ----- Getters -----

    public String getAccessToken() { return accessToken; }
    public String getTokenType() { return tokenType; }
    public long getExpiresIn() { return expiresIn; }
    public Integer getAccountId() { return accountId; }
    public String getRole() { return role; }
    public Integer getEmployeeId() { return employeeId; }
    public List<String> getPermissions() { return permissions; }
}
