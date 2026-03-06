package com.companyx.synpay_dashboard.entity.payroll;

import java.time.LocalDateTime;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Immutable
@Table(name = "positions_payroll")
public class PositionPayroll {

    @Id
    @Column(name = "PositionID")
    private Integer positionId;

    @Column(name = "PositionName", nullable = false, length = 100)
    private String positionName;

    @Column(name = "SyncedAt")
    private LocalDateTime syncedAt;

    public Integer getPositionId() { return positionId; }
    public String getPositionName() { return positionName; }
    public LocalDateTime getSyncedAt() { return syncedAt; }
}
