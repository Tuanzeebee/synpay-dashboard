package com.companyx.synpay_dashboard.security.jwt;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

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
    private final long refreshExpirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms:900000}") long expirationMs,
            @Value("${app.jwt.refresh-expiration-ms:604800000}") long refreshExpirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
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

    // ── Refresh token helpers ────────────────────────────────────

    /**
     * Returns the configured refresh token expiration in milliseconds.
     */
    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }

    /**
     * Generates a cryptographically random refresh token (UUID v4).
     */
    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }

    /**
     * SHA-256 hash of a refresh token for secure database storage.
     */
    public static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
