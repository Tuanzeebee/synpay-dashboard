package com.companyx.synpay_dashboard.security.jwt;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.companyx.synpay_dashboard.security.GatewayPrincipal;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Generates, parses and validates JWTs for the SynPay platform.
 *
 * <p>Token generation is used by the internal authentication endpoint
 * ({@code POST /internal/auth/login}) to issue access tokens.
 *
 * <p>Token parsing is used by {@link com.companyx.synpay_dashboard.security.InternalApiAuthFilter}
 * to validate tokens forwarded by the Python API Gateway.
 *
 * <p>Expected JWT claims:
 * <ul>
 *   <li><b>sub</b> – account_id (string representation of integer)</li>
 *   <li><b>email</b> – account email</li>
 *   <li><b>employee_id</b> – linked employee id</li>
 *   <li><b>role</b> – role code</li>
 *   <li><b>permissions</b> – list of permission keys</li>
 *   <li><b>iss</b> – issuer (e.g. "synpay-core")</li>
 * </ul>
 */
@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);
    private static final String ISSUER = "synpay-core";

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms:3600000}") long expirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**
     * Returns the configured token expiration in milliseconds.
     */
    public long getExpirationMs() {
        return expirationMs;
    }

    /**
     * Generates a signed JWT access token containing the user's identity and RBAC data.
     *
     * @param accountId   the authenticated account id
     * @param email       the account email
     * @param employeeId  the linked employee id
     * @param roleCode    the primary role code
     * @param permissions list of enabled permission keys
     * @return signed JWT string
     */
    public String generateToken(Integer accountId,
                                String email,
                                Integer employeeId,
                                String roleCode,
                                List<String> permissions) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(expirationMs);

        return Jwts.builder()
                .subject(String.valueOf(accountId))
                .claim("email", email)
                .claim("employee_id", employeeId)
                .claim("role", roleCode)
                .claim("permissions", permissions)
                .issuer(ISSUER)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Validates the token signature &amp; expiry, then extracts the caller identity.
     *
     * @return a {@link GatewayPrincipal} on success
     * @throws JwtException if the token is invalid, expired, or malformed
     */
    public GatewayPrincipal parseToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        int accountId      = Integer.parseInt(claims.getSubject());
        String  email      = claims.get("email", String.class);

        // employee_id may arrive as a String or a Number depending on how the
        // gateway encoded the JWT, so handle both gracefully.
        Object empIdRaw    = claims.get("employee_id");
        Integer employeeId = empIdRaw != null
                ? Integer.valueOf(empIdRaw.toString())
                : null;

        String role = claims.get("role", String.class);

        return new GatewayPrincipal(accountId, employeeId, email, role);
    }

    /**
     * Quick validity check (signature + expiry) without building a principal.
     */
    public boolean isValid(String token) {
        try {
            Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }
}
