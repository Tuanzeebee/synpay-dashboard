package com.companyx.synpay_dashboard.exceptions;

/**
 * Thrown when a requested resource (account, role, etc.) does not exist.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " not found with id: " + id);
    }
}
