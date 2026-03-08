package com.companyx.synpay_dashboard.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO for {@code GET /internal/dashboard/attendance}.
 * <p>
 * Provides attendance dashboard data: attendance rate,
 * total leave days, and month-over-month change.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardAttendanceResponse {

    private double attendanceRate;
    private int totalLeaveDays;
    private int totalAbsentDays;
    private int totalWorkDays;
    private double leaveChangePercent;

    public double getAttendanceRate() { return attendanceRate; }
    public void setAttendanceRate(double attendanceRate) { this.attendanceRate = attendanceRate; }

    public int getTotalLeaveDays() { return totalLeaveDays; }
    public void setTotalLeaveDays(int totalLeaveDays) { this.totalLeaveDays = totalLeaveDays; }

    public int getTotalAbsentDays() { return totalAbsentDays; }
    public void setTotalAbsentDays(int totalAbsentDays) { this.totalAbsentDays = totalAbsentDays; }

    public int getTotalWorkDays() { return totalWorkDays; }
    public void setTotalWorkDays(int totalWorkDays) { this.totalWorkDays = totalWorkDays; }

    public double getLeaveChangePercent() { return leaveChangePercent; }
    public void setLeaveChangePercent(double leaveChangePercent) { this.leaveChangePercent = leaveChangePercent; }
}
