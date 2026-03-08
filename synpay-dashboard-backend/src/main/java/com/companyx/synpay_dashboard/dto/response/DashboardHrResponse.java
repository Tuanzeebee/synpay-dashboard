package com.companyx.synpay_dashboard.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO for {@code GET /internal/dashboard/hr}.
 * <p>
 * Provides HR-specific dashboard data: employee distribution by
 * department and headcount growth trend over the last 12 months.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardHrResponse {

    private int totalEmployees;
    private int activeEmployees;
    private double growthPercent;
    private List<DashboardOverviewResponse.NameValueItem> departmentDistribution;
    private List<DashboardOverviewResponse.MonthValueItem> headcountTrend;

    public int getTotalEmployees() { return totalEmployees; }
    public void setTotalEmployees(int totalEmployees) { this.totalEmployees = totalEmployees; }

    public int getActiveEmployees() { return activeEmployees; }
    public void setActiveEmployees(int activeEmployees) { this.activeEmployees = activeEmployees; }

    public double getGrowthPercent() { return growthPercent; }
    public void setGrowthPercent(double growthPercent) { this.growthPercent = growthPercent; }

    public List<DashboardOverviewResponse.NameValueItem> getDepartmentDistribution() { return departmentDistribution; }
    public void setDepartmentDistribution(List<DashboardOverviewResponse.NameValueItem> departmentDistribution) { this.departmentDistribution = departmentDistribution; }

    public List<DashboardOverviewResponse.MonthValueItem> getHeadcountTrend() { return headcountTrend; }
    public void setHeadcountTrend(List<DashboardOverviewResponse.MonthValueItem> headcountTrend) { this.headcountTrend = headcountTrend; }
}
