package com.companyx.synpay_dashboard.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.Set;

/**
 * Request body for PUT /internal/users/{id}.
 * All fields are optional – only provided fields are updated.
 */
public class UpdateUserRequest {

    @Email(message = "Invalid email format")
    private String email;

    @Size(min = 8, max = 128, message = "Password must be 8-128 characters")
    private String password;

    private String status;

    @Size(min = 1, message = "At least one role must be assigned")
    private Set<Integer> roleIds;

    // ----- Getters & Setters -----

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Set<Integer> getRoleIds() { return roleIds; }
    public void setRoleIds(Set<Integer> roleIds) { this.roleIds = roleIds; }
}
