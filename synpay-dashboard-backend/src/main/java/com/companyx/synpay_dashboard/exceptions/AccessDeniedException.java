package com.companyx.synpay_dashboard.exceptions;

/**
 * Thrown when an authenticated user lacks the required RBAC permission.
 */
public class AccessDeniedException extends RuntimeException {

    public AccessDeniedException(String message) {
        super(message);
    }
}
