package com.companyx.synpay_dashboard.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO for the Dashboard summary report.
 * Provides high-level KPIs and overview metrics.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardReportResponse {

    private int totalEmployees;
    private int totalDepartments;
    private double payrollTotalThisMonth;
    private double attendanceRate;
    private double growthRate;
    private double avgSalary;
    private List<ReportsDataResponse.StatusDistributionResponse> statusDistribution;
    private List<ReportsDataResponse.PerformanceResponse> performance;

    // ----- Getters & Setters -----

    public int getTotalEmployees() { return totalEmployees; }
    public void setTotalEmployees(int totalEmployees) { this.totalEmployees = totalEmployees; }

    public int getTotalDepartments() { return totalDepartments; }
    public void setTotalDepartments(int totalDepartments) { this.totalDepartments = totalDepartments; }

    public double getPayrollTotalThisMonth() { return payrollTotalThisMonth; }
    public void setPayrollTotalThisMonth(double payrollTotalThisMonth) { this.payrollTotalThisMonth = payrollTotalThisMonth; }

    public double getAttendanceRate() { return attendanceRate; }
    public void setAttendanceRate(double attendanceRate) { this.attendanceRate = attendanceRate; }

    public double getGrowthRate() { return growthRate; }
    public void setGrowthRate(double growthRate) { this.growthRate = growthRate; }

    public double getAvgSalary() { return avgSalary; }
    public void setAvgSalary(double avgSalary) { this.avgSalary = avgSalary; }

    public List<ReportsDataResponse.StatusDistributionResponse> getStatusDistribution() { return statusDistribution; }
    public void setStatusDistribution(List<ReportsDataResponse.StatusDistributionResponse> statusDistribution) { this.statusDistribution = statusDistribution; }

    public List<ReportsDataResponse.PerformanceResponse> getPerformance() { return performance; }
    public void setPerformance(List<ReportsDataResponse.PerformanceResponse> performance) { this.performance = performance; }
}
