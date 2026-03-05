package com.companyx.synpay_dashboard.utils.enums;

/**
 * Enumeration of auditable target (resource) types.
 *
 * <p>Values are stored as lowercase strings in the {@code resource} column
 * of the {@code audit_log} table. Used for filtering and reporting.</p>
 */
public enum TargetType {

    ACCOUNT("account"),
    USER("user"),
    ROLE("role"),
    PERMISSION("permission"),
    PERMISSION_MATRIX("permission_matrix"),
    EMPLOYEE("employee"),
    DEPARTMENT("department"),
    POSITION("position"),
    PAYROLL("payroll"),
    SYSTEM("system");

    private final String value;

    TargetType(String value) {
        this.value = value;
    }

    /** The lowercase string stored in the database. */
    public String getValue() {
        return value;
    }

    /**
     * Safely parse a string to a TargetType, returning {@code null}
     * if the value does not match any known target.
     */
    public static TargetType fromString(String value) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.toLowerCase().trim();
        for (TargetType t : values()) {
            if (t.value.equals(normalized)) return t;
        }
        return null;
    }
}
