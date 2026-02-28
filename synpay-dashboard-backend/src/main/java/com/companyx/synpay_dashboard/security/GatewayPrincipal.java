package com.companyx.synpay_dashboard.security;

/**
 * Holds the identity of the caller extracted from the JWT forwarded by the
 * Python API Gateway.  Carried through the request via
 * {@link GatewayAuthenticationToken} in the Spring Security context.
 */
public class GatewayPrincipal {

    private final Integer accountId;
    private final Integer employeeId;
    private final String email;

    public GatewayPrincipal(Integer accountId, Integer employeeId, String email) {
        this.accountId = accountId;
        this.employeeId = employeeId;
        this.email = email;
    }

    public Integer getAccountId()  { return accountId; }
    public Integer getEmployeeId() { return employeeId; }
    public String  getEmail()      { return email; }

    @Override
    public String toString() {
        return "GatewayPrincipal{accountId=" + accountId +
               ", employeeId=" + employeeId +
               ", email='" + email + "'}";
    }
}
