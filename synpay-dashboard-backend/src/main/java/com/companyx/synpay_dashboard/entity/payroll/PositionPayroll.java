package com.companyx.synpay_dashboard.entity.payroll;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "positions_payroll")
public class PositionPayroll {

    @Id
    @Column(name = "PositionID")
    private Integer positionId;

    @Column(name = "PositionName", nullable = false, length = 100)
    private String positionName;

    @Column(name = "SyncedAt", updatable = false)
    private LocalDateTime syncedAt;

    @PrePersist
    protected void onCreate() {
        this.syncedAt = LocalDateTime.now();
    }

    // ----- Getters & Setters -----

    public Integer getPositionId() { return positionId; }
    public void setPositionId(Integer positionId) { this.positionId = positionId; }

    public String getPositionName() { return positionName; }
    public void setPositionName(String positionName) { this.positionName = positionName; }

    public LocalDateTime getSyncedAt() { return syncedAt; }
}
