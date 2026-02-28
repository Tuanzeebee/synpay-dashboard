package com.companyx.synpay_dashboard.exceptions;

/**
 * Thrown for business rule violations (e.g. duplicate email).
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
