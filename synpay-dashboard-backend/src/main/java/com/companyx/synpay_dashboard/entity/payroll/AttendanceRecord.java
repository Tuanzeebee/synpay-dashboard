package com.companyx.synpay_dashboard.entity.payroll;

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
 * JPA entity mapped to the {@code attendance} table in the payroll database.
 *
 * <p>Attendance records are <strong>immutable by default</strong>;
 * only authorised adjustments (with {@code ATTENDANCE_WRITE}) may
 * modify {@code workDays}, {@code absentDays} or {@code leaveDays}.</p>
 */
@Entity
@Table(name = "attendance")
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AttendanceID")
    private Integer attendanceId;

    @Column(name = "EmployeeID")
    private Integer employeeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EmployeeID", insertable = false, updatable = false)
    private EmployeePayroll employee;

    @Column(name = "WorkDays", nullable = false)
    private Integer workDays;

    @Column(name = "AbsentDays")
    private Integer absentDays;

    @Column(name = "LeaveDays")
    private Integer leaveDays;

    @Column(name = "AttendanceMonth", nullable = false)
    private LocalDate attendanceMonth;

    @Column(name = "CreatedAt", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // ----- Getters & Setters -----

    public Integer getAttendanceId() { return attendanceId; }

    public Integer getEmployeeId() { return employeeId; }

    public EmployeePayroll getEmployee() { return employee; }

    public Integer getWorkDays() { return workDays; }
    public void setWorkDays(Integer workDays) { this.workDays = workDays; }

    public Integer getAbsentDays() { return absentDays; }
    public void setAbsentDays(Integer absentDays) { this.absentDays = absentDays; }

    public Integer getLeaveDays() { return leaveDays; }
    public void setLeaveDays(Integer leaveDays) { this.leaveDays = leaveDays; }

    public LocalDate getAttendanceMonth() { return attendanceMonth; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
