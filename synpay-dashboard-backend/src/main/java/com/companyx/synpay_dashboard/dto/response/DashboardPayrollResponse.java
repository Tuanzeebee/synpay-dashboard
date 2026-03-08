package com.companyx.synpay_dashboard.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO for {@code GET /internal/dashboard/payroll}.
 * <p>
 * Provides payroll dashboard data: monthly payroll trend over
 * the last 12 months and salary distribution by department.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardPayrollResponse {

    private double totalPayroll;
    private double avgSalary;
    private double changePercent;
    private List<DashboardOverviewResponse.MonthValueItem> payrollTrend;
    private List<DashboardOverviewResponse.DonutItem> payrollByDepartment;

    public double getTotalPayroll() { return totalPayroll; }
    public void setTotalPayroll(double totalPayroll) { this.totalPayroll = totalPayroll; }

    public double getAvgSalary() { return avgSalary; }
    public void setAvgSalary(double avgSalary) { this.avgSalary = avgSalary; }

    public double getChangePercent() { return changePercent; }
    public void setChangePercent(double changePercent) { this.changePercent = changePercent; }

    public List<DashboardOverviewResponse.MonthValueItem> getPayrollTrend() { return payrollTrend; }
    public void setPayrollTrend(List<DashboardOverviewResponse.MonthValueItem> payrollTrend) { this.payrollTrend = payrollTrend; }

    public List<DashboardOverviewResponse.DonutItem> getPayrollByDepartment() { return payrollByDepartment; }
    public void setPayrollByDepartment(List<DashboardOverviewResponse.DonutItem> payrollByDepartment) { this.payrollByDepartment = payrollByDepartment; }
}
