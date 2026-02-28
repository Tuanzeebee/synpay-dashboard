package com.companyx.synpay_dashboard.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

/**
 * Request body for POST /internal/users
 */
public class CreateUserRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be 8-128 characters")
    private String password;

    @NotNull(message = "Employee ID is required")
    private Integer employeeId;

    @NotNull(message = "At least one role must be assigned")
    @Size(min = 1, message = "At least one role must be assigned")
    private Set<Integer> roleIds;

    // ----- Getters & Setters -----

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Integer getEmployeeId() { return employeeId; }
    public void setEmployeeId(Integer employeeId) { this.employeeId = employeeId; }

    public Set<Integer> getRoleIds() { return roleIds; }
    public void setRoleIds(Set<Integer> roleIds) { this.roleIds = roleIds; }
}
