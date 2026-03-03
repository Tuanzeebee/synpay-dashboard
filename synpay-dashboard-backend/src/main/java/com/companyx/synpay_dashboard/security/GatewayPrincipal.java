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
    private final String role;

    public GatewayPrincipal(Integer accountId, Integer employeeId, String email) {
        this(accountId, employeeId, email, null);
    }

    public GatewayPrincipal(Integer accountId, Integer employeeId, String email, String role) {
        this.accountId = accountId;
        this.employeeId = employeeId;
        this.email = email;
        this.role = role;
    }

    public Integer getAccountId()  { return accountId; }
    public Integer getEmployeeId() { return employeeId; }
    public String  getEmail()      { return email; }
    public String  getRole()       { return role; }

    @Override
    public String toString() {
        return "GatewayPrincipal{accountId=" + accountId +
               ", employeeId=" + employeeId +
               ", email='" + email +
               "', role='" + role + "'}";
    }
}
