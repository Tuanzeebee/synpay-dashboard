package com.companyx.synpay_dashboard.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;

/**
 * Request body for adjusting a salary record.
 * All fields are optional — only provided fields will be updated.
 * If netSalary is not provided, it is recalculated as baseSalary + bonus - deductions.
 */
public class AdjustSalaryRequest {

    @DecimalMin(value = "0.00", message = "Base salary must be >= 0")
    private BigDecimal baseSalary;

    @DecimalMin(value = "0.00", message = "Bonus must be >= 0")
    private BigDecimal bonus;

    @DecimalMin(value = "0.00", message = "Deductions must be >= 0")
    private BigDecimal deductions;

    @DecimalMin(value = "0.00", message = "Net salary must be >= 0")
    private BigDecimal netSalary;

    public BigDecimal getBaseSalary() { return baseSalary; }
    public void setBaseSalary(BigDecimal baseSalary) { this.baseSalary = baseSalary; }

    public BigDecimal getBonus() { return bonus; }
    public void setBonus(BigDecimal bonus) { this.bonus = bonus; }

    public BigDecimal getDeductions() { return deductions; }
    public void setDeductions(BigDecimal deductions) { this.deductions = deductions; }

    public BigDecimal getNetSalary() { return netSalary; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }
}
