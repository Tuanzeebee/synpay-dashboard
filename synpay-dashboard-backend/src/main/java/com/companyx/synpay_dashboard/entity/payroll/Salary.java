package com.companyx.synpay_dashboard.entity.payroll;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * JPA entity mapped to the {@code salaries} table in the payroll database.
 *
 * <p>Salary records are <strong>mostly immutable</strong>:
 * only {@code Bonus} and {@code Deductions} may be adjusted,
 * and {@code NetSalary} is recalculated accordingly.</p>
 */
@Entity
@Table(name = "salaries")
public class Salary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SalaryID")
    private Integer salaryId;

    @Column(name = "EmployeeID")
    private Integer employeeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EmployeeID", insertable = false, updatable = false)
    private EmployeePayroll employee;

    @Column(name = "SalaryMonth", nullable = false)
    private LocalDate salaryMonth;

    @Column(name = "BaseSalary", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseSalary;

    @Column(name = "Bonus", precision = 12, scale = 2)
    private BigDecimal bonus;

    @Column(name = "Deductions", precision = 12, scale = 2)
    private BigDecimal deductions;

    @Column(name = "NetSalary", nullable = false, precision = 12, scale = 2)
    private BigDecimal netSalary;

    @Column(name = "CreatedAt", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // ----- Getters & Setters -----

    public Integer getSalaryId() { return salaryId; }

    public Integer getEmployeeId() { return employeeId; }
    public void setEmployeeId(Integer employeeId) { this.employeeId = employeeId; }

    public EmployeePayroll getEmployee() { return employee; }

    public LocalDate getSalaryMonth() { return salaryMonth; }
    public void setSalaryMonth(LocalDate salaryMonth) { this.salaryMonth = salaryMonth; }

    public BigDecimal getBaseSalary() { return baseSalary; }
    public void setBaseSalary(BigDecimal baseSalary) { this.baseSalary = baseSalary; }

    public BigDecimal getBonus() { return bonus; }
    public void setBonus(BigDecimal bonus) { this.bonus = bonus; }

    public BigDecimal getDeductions() { return deductions; }
    public void setDeductions(BigDecimal deductions) { this.deductions = deductions; }

    public BigDecimal getNetSalary() { return netSalary; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
