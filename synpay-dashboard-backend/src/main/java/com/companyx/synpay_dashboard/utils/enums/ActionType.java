package com.companyx.synpay_dashboard.utils.enums;

/**
 * Enumeration of all auditable action types in the system.
 *
 * <p>Values are stored as uppercase strings in the {@code action} column
 * of the {@code audit_log} table. Used for filtering and reporting.</p>
 */
public enum ActionType {

    // ── Authentication ───────────────────────────────────────────
    LOGIN,
    LOGIN_FAILED,
    LOGIN_SUCCESS,
    LOGOUT,

    // ── User Management ──────────────────────────────────────────
    USER_CREATE,
    USER_UPDATE,
    USER_DELETE,

    // ── Role Management ──────────────────────────────────────────
    ROLE_CREATE,
    ROLE_UPDATE,
    ROLE_DELETE,
    ROLE_ASSIGN,

    // ── Permission Management ────────────────────────────────────
    PERMISSION_ASSIGN,
    PERMISSION_MATRIX_UPDATE,

    // ── Employee Management ──────────────────────────────────────
    EMPLOYEE_CREATE,
    EMPLOYEE_UPDATE,
    EMPLOYEE_STATUS_CHANGE,
    EMPLOYEE_ASSIGN_ACCOUNT,

    // ── Department Management ────────────────────────────────────
    DEPARTMENT_CREATE,
    DEPARTMENT_UPDATE,
    DEPARTMENT_STATUS_CHANGE,

    // ── Position Management ──────────────────────────────────────
    POSITION_CREATE,
    POSITION_UPDATE,
    POSITION_STATUS_CHANGE,

    // ── Data & System ────────────────────────────────────────────
    DATA_EXPORT,
    SYSTEM_CONFIG;

    /**
     * Safely parse a string to an ActionType, returning {@code null}
     * if the value does not match any enum constant.
     */
    public static ActionType fromString(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return ActionType.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
