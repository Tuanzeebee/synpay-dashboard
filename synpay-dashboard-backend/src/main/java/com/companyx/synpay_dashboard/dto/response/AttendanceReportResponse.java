package com.companyx.synpay_dashboard.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO for the Attendance report.
 * Provides attendance rates, leave breakdowns, and absent trends.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AttendanceReportResponse {

    private double overallAttendanceRate;
    private int totalLeave;
    private double leaveChange;
    private List<ReportsDataResponse.AttendanceRateResponse> attendance;
    private List<ReportsDataResponse.LeaveTypeResponse> leaveTypes;

    // ----- Getters & Setters -----

    public double getOverallAttendanceRate() { return overallAttendanceRate; }
    public void setOverallAttendanceRate(double overallAttendanceRate) { this.overallAttendanceRate = overallAttendanceRate; }

    public int getTotalLeave() { return totalLeave; }
    public void setTotalLeave(int totalLeave) { this.totalLeave = totalLeave; }

    public double getLeaveChange() { return leaveChange; }
    public void setLeaveChange(double leaveChange) { this.leaveChange = leaveChange; }

    public List<ReportsDataResponse.AttendanceRateResponse> getAttendance() { return attendance; }
    public void setAttendance(List<ReportsDataResponse.AttendanceRateResponse> attendance) { this.attendance = attendance; }

    public List<ReportsDataResponse.LeaveTypeResponse> getLeaveTypes() { return leaveTypes; }
    public void setLeaveTypes(List<ReportsDataResponse.LeaveTypeResponse> leaveTypes) { this.leaveTypes = leaveTypes; }
}
