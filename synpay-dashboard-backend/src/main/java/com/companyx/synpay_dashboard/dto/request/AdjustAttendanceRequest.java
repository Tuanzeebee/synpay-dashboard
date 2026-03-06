package com.companyx.synpay_dashboard.dto.request;

import jakarta.validation.constraints.Min;

/**
 * Request body for adjusting an attendance record.
 * All fields are optional — only provided fields will be updated.
 */
public class AdjustAttendanceRequest {

    @Min(value = 0, message = "Work days must be >= 0")
    private Integer workDays;

    @Min(value = 0, message = "Absent days must be >= 0")
    private Integer absentDays;

    @Min(value = 0, message = "Leave days must be >= 0")
    private Integer leaveDays;

    private String reason;

    public Integer getWorkDays() { return workDays; }
    public void setWorkDays(Integer workDays) { this.workDays = workDays; }

    public Integer getAbsentDays() { return absentDays; }
    public void setAbsentDays(Integer absentDays) { this.absentDays = absentDays; }

    public Integer getLeaveDays() { return leaveDays; }
    public void setLeaveDays(Integer leaveDays) { this.leaveDays = leaveDays; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
