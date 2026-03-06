package com.companyx.synpay_dashboard.entity.payroll;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "employees_payroll")
public class EmployeePayroll {

    @Id
    @Column(name = "EmployeeID")
    private Integer employeeId;

    @Column(name = "FullName", nullable = false, length = 100)
    private String fullName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DepartmentID", insertable = false, updatable = false)
    private DepartmentPayroll department;

    @Column(name = "DepartmentID")
    private Integer departmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PositionID", insertable = false, updatable = false)
    private PositionPayroll position;

    @Column(name = "PositionID")
    private Integer positionId;

    @Column(name = "Status", length = 50)
    private String status;

    @Column(name = "SyncedAt")
    private LocalDateTime syncedAt;

    // ----- Getters -----

    public Integer getEmployeeId() { return employeeId; }
    public String getFullName() { return fullName; }
    public DepartmentPayroll getDepartment() { return department; }
    public Integer getDepartmentId() { return departmentId; }
    public PositionPayroll getPosition() { return position; }
    public Integer getPositionId() { return positionId; }
    public String getStatus() { return status; }
    public LocalDateTime getSyncedAt() { return syncedAt; }

    // ----- Setters -----

    public void setEmployeeId(Integer employeeId) { this.employeeId = employeeId; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setDepartmentId(Integer departmentId) { this.departmentId = departmentId; }
    public void setPositionId(Integer positionId) { this.positionId = positionId; }
    public void setStatus(String status) { this.status = status; }
    public void setSyncedAt(LocalDateTime syncedAt) { this.syncedAt = syncedAt; }
}
