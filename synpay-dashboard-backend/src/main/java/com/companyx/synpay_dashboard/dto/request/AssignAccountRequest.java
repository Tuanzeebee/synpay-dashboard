package com.companyx.synpay_dashboard.dto.request;

import jakarta.validation.constraints.NotNull;

public class AssignAccountRequest {

    @NotNull(message = "Account ID is required")
    private Integer accountId;

    // ----- Getters & Setters -----

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }
}
