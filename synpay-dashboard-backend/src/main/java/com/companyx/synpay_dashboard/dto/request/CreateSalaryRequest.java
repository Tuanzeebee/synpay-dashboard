package com.companyx.synpay_dashboard.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for creating a new salary record.
 * employeeId, salaryMonth, and baseSalary are required.
 * If netSalary is not provided, it is calculated as baseSalary + bonus - deductions.
 */
public class CreateSalaryRequest {

    @NotNull(message = "Employee ID is required")
    private Integer employeeId;

    @NotNull(message = "Salary month is required (format: yyyy-MM-dd)")
    private String salaryMonth;

    @NotNull(message = "Base salary is required")
    @DecimalMin(value = "0.00", message = "Base salary must be >= 0")
    private BigDecimal baseSalary;

    @DecimalMin(value = "0.00", message = "Bonus must be >= 0")
    private BigDecimal bonus;

    @DecimalMin(value = "0.00", message = "Deductions must be >= 0")
    private BigDecimal deductions;

    @DecimalMin(value = "0.00", message = "Net salary must be >= 0")
    private BigDecimal netSalary;

    public Integer getEmployeeId() { return employeeId; }
    public void setEmployeeId(Integer employeeId) { this.employeeId = employeeId; }

    public String getSalaryMonth() { return salaryMonth; }
    public void setSalaryMonth(String salaryMonth) { this.salaryMonth = salaryMonth; }

    public BigDecimal getBaseSalary() { return baseSalary; }
    public void setBaseSalary(BigDecimal baseSalary) { this.baseSalary = baseSalary; }

    public BigDecimal getBonus() { return bonus; }
    public void setBonus(BigDecimal bonus) { this.bonus = bonus; }

    public BigDecimal getDeductions() { return deductions; }
    public void setDeductions(BigDecimal deductions) { this.deductions = deductions; }

    public BigDecimal getNetSalary() { return netSalary; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }
}
