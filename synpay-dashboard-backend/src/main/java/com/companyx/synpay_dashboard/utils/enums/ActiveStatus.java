package com.companyx.synpay_dashboard.utils.enums;

/**
 * Master-data activation status for Department and Position.
 */
public enum ActiveStatus {

    ACTIVE,
    INACTIVE;

    public static ActiveStatus fromString(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return ActiveStatus.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
