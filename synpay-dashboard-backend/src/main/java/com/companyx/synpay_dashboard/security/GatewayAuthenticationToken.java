package com.companyx.synpay_dashboard.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;

import java.util.Collections;

/**
 * Spring Security authentication token that wraps a {@link GatewayPrincipal}.
 * Created by {@link InternalApiAuthFilter} after successful JWT validation.
 */
public class GatewayAuthenticationToken extends AbstractAuthenticationToken {

    private final GatewayPrincipal principal;

    public GatewayAuthenticationToken(GatewayPrincipal principal) {
        super(Collections.emptyList());
        this.principal = principal;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public GatewayPrincipal getPrincipal() {
        return principal;
    }
}
