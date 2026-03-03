package com.companyx.synpay_dashboard.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateEmployeeRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @NotNull(message = "Date of birth is required")
    private LocalDate dateOfBirth;

    @Size(max = 10, message = "Gender must not exceed 10 characters")
    private String gender;

    @Size(max = 15, message = "Phone number must not exceed 15 characters")
    private String phoneNumber;

    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @NotNull(message = "Hire date is required")
    private LocalDate hireDate;

    @NotNull(message = "Department ID is required")
    private Integer departmentId;

    @NotNull(message = "Position ID is required")
    private Integer positionId;

    @Size(max = 50, message = "Status must not exceed 50 characters")
    private String status;

    // ----- Getters & Setters -----

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }

    public Integer getDepartmentId() { return departmentId; }
    public void setDepartmentId(Integer departmentId) { this.departmentId = departmentId; }

    public Integer getPositionId() { return positionId; }
    public void setPositionId(Integer positionId) { this.positionId = positionId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
