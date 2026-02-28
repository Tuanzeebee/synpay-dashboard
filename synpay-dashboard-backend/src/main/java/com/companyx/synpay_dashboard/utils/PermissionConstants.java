package com.companyx.synpay_dashboard.utils;

/**
 * Holds the permission key constants used for RBAC checks.
 * These must match the {@code key} column values seeded in the
 * {@code permission} table of auth_db.
 */
public final class PermissionConstants {

    private PermissionConstants() {}

    // ---- User Management ----
    public static final String USER_READ  = "user.read";
    public static final String USER_WRITE = "user.write";

    // ---- Role Management ----
    public static final String ROLE_READ  = "role.read";
    public static final String ROLE_WRITE = "role.write";

    // ---- Permission Management ----
    public static final String PERMISSION_READ  = "permission.read";
    public static final String PERMISSION_WRITE = "permission.write";

    // ---- Audit Log ----
    public static final String AUDIT_READ = "audit.read";
}
