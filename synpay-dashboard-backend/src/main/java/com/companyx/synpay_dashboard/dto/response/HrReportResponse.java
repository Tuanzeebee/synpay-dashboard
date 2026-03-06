package com.companyx.synpay_dashboard.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO for the HR report.
 * Provides employee-centric metrics: department distribution,
 * status breakdown, and new hire growth.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HrReportResponse {

    private int totalEmployees;
    private double growthRate;
    private List<ReportsDataResponse.DepartmentReportResponse> departments;
    private List<ReportsDataResponse.StatusDistributionResponse> statusDistribution;
    private List<ReportsDataResponse.PerformanceResponse> performance;

    // ----- Getters & Setters -----

    public int getTotalEmployees() { return totalEmployees; }
    public void setTotalEmployees(int totalEmployees) { this.totalEmployees = totalEmployees; }

    public double getGrowthRate() { return growthRate; }
    public void setGrowthRate(double growthRate) { this.growthRate = growthRate; }

    public List<ReportsDataResponse.DepartmentReportResponse> getDepartments() { return departments; }
    public void setDepartments(List<ReportsDataResponse.DepartmentReportResponse> departments) { this.departments = departments; }

    public List<ReportsDataResponse.StatusDistributionResponse> getStatusDistribution() { return statusDistribution; }
    public void setStatusDistribution(List<ReportsDataResponse.StatusDistributionResponse> statusDistribution) { this.statusDistribution = statusDistribution; }

    public List<ReportsDataResponse.PerformanceResponse> getPerformance() { return performance; }
    public void setPerformance(List<ReportsDataResponse.PerformanceResponse> performance) { this.performance = performance; }
}
