package com.companyx.synpay_dashboard.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO for the Payroll report.
 * Provides salary-centric metrics: totals, trends, and distribution.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PayrollReportResponse {

    private double totalSalary;
    private double avgSalary;
    private List<ReportsDataResponse.SalaryTrendResponse> salaryTrend;
    private List<ReportsDataResponse.DepartmentReportResponse> departments;
    private List<ReportsDataResponse.DividendTrendResponse> dividends;

    // ----- Getters & Setters -----

    public double getTotalSalary() { return totalSalary; }
    public void setTotalSalary(double totalSalary) { this.totalSalary = totalSalary; }

    public double getAvgSalary() { return avgSalary; }
    public void setAvgSalary(double avgSalary) { this.avgSalary = avgSalary; }

    public List<ReportsDataResponse.SalaryTrendResponse> getSalaryTrend() { return salaryTrend; }
    public void setSalaryTrend(List<ReportsDataResponse.SalaryTrendResponse> salaryTrend) { this.salaryTrend = salaryTrend; }

    public List<ReportsDataResponse.DepartmentReportResponse> getDepartments() { return departments; }
    public void setDepartments(List<ReportsDataResponse.DepartmentReportResponse> departments) { this.departments = departments; }

    public List<ReportsDataResponse.DividendTrendResponse> getDividends() { return dividends; }
    public void setDividends(List<ReportsDataResponse.DividendTrendResponse> dividends) { this.dividends = dividends; }
}
