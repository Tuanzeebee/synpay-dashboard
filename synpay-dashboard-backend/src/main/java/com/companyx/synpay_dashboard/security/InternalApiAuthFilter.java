package com.companyx.synpay_dashboard.security;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.companyx.synpay_dashboard.security.jwt.JwtTokenProvider;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Extracts and validates the JWT from the {@code Authorization: Bearer <token>}
 * header on every {@code /internal/**} request.  On success, populates the
 * Spring Security context with a {@link GatewayAuthenticationToken}.
 */
@Component
public class InternalApiAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(InternalApiAuthFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;

    public InternalApiAuthFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (!uri.startsWith("/internal/")) {
            return true;
        }
        // Skip login and refresh endpoints (no JWT required)
        return uri.equals("/internal/auth/login") || uri.equals("/internal/auth/refresh");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "TOKEN_MISSING", "Missing or invalid Authorization header");
            return;
        }

        String token = authHeader.substring(BEARER_PREFIX.length()).trim();

        try {
            GatewayPrincipal principal = jwtTokenProvider.parseToken(token);
            GatewayAuthenticationToken authentication = new GatewayAuthenticationToken(principal);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("Authenticated gateway request – account_id={}", principal.getAccountId());
            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException ex) {
            log.warn("JWT expired for subject={}", ex.getClaims().getSubject());
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "TOKEN_EXPIRED", "Access token has expired");

        } catch (SignatureException ex) {
            log.warn("JWT signature mismatch: {}", ex.getMessage());
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "TOKEN_INVALID", "Token signature verification failed");

        } catch (MalformedJwtException ex) {
            log.warn("Malformed JWT: {}", ex.getMessage());
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "TOKEN_MALFORMED", "Token is not a valid JWT");

        } catch (UnsupportedJwtException ex) {
            log.warn("Unsupported JWT: {}", ex.getMessage());
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "TOKEN_INVALID", "Token type is not supported");

        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("JWT authentication failed: {}", ex.getMessage());
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "TOKEN_INVALID", "Invalid authentication token");
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void sendError(HttpServletResponse response, int status,
                           String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"success\":false,\"error\":{\"code\":\"" + code
                        + "\",\"message\":\"" + message + "\"}}"
        );
    }
}
