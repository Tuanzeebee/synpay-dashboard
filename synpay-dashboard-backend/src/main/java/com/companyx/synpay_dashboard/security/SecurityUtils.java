package com.companyx.synpay_dashboard.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Static helper to retrieve the current {@link GatewayPrincipal} from
 * the Spring Security context.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    /**
     * Returns the authenticated gateway principal or throws if none is present.
     */
    public static GatewayPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof GatewayAuthenticationToken gat) {
            return gat.getPrincipal();
        }
        throw new com.companyx.synpay_dashboard.exceptions.AccessDeniedException("No authenticated principal in context");
    }
}
