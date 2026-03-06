package com.companyx.synpay_dashboard.entity.hr;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * JPA entity mapped to the {@code Dividends} table in the HUMAN (HR) database.
 * Dividends are read-only in the reports context.
 */
@Entity
@Immutable
@Table(name = "Dividends")
public class Dividend {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DividendID")
    private Integer dividendId;

    @Column(name = "EmployeeID")
    private Integer employeeId;

    @Column(name = "DividendAmount", nullable = false, precision = 12, scale = 2)
    private BigDecimal dividendAmount;

    @Column(name = "DividendDate", nullable = false)
    private LocalDate dividendDate;

    @Column(name = "CreatedAt", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // ----- Getters -----

    public Integer getDividendId() { return dividendId; }
    public Integer getEmployeeId() { return employeeId; }
    public BigDecimal getDividendAmount() { return dividendAmount; }
    public LocalDate getDividendDate() { return dividendDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
