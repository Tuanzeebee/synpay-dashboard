package com.companyx.synpay_dashboard.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * Top-level response DTO for the Reports & Analytics endpoint.
 * Mirrors the frontend {@code ReportsData} interface.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReportsDataResponse {

    private KPIResponse kpis;
    private List<DepartmentReportResponse> departments;
    private List<SalaryTrendResponse> salaryTrend;
    private List<StatusDistributionResponse> statusDistribution;
    private List<LeaveTypeResponse> leaveTypes;
    private List<AttendanceRateResponse> attendance;
    private List<DividendTrendResponse> dividends;
    private List<PerformanceResponse> performance;

    // ----- Getters & Setters -----

    public KPIResponse getKpis() { return kpis; }
    public void setKpis(KPIResponse kpis) { this.kpis = kpis; }

    public List<DepartmentReportResponse> getDepartments() { return departments; }
    public void setDepartments(List<DepartmentReportResponse> departments) { this.departments = departments; }

    public List<SalaryTrendResponse> getSalaryTrend() { return salaryTrend; }
    public void setSalaryTrend(List<SalaryTrendResponse> salaryTrend) { this.salaryTrend = salaryTrend; }

    public List<StatusDistributionResponse> getStatusDistribution() { return statusDistribution; }
    public void setStatusDistribution(List<StatusDistributionResponse> statusDistribution) { this.statusDistribution = statusDistribution; }

    public List<LeaveTypeResponse> getLeaveTypes() { return leaveTypes; }
    public void setLeaveTypes(List<LeaveTypeResponse> leaveTypes) { this.leaveTypes = leaveTypes; }

    public List<AttendanceRateResponse> getAttendance() { return attendance; }
    public void setAttendance(List<AttendanceRateResponse> attendance) { this.attendance = attendance; }

    public List<DividendTrendResponse> getDividends() { return dividends; }
    public void setDividends(List<DividendTrendResponse> dividends) { this.dividends = dividends; }

    public List<PerformanceResponse> getPerformance() { return performance; }
    public void setPerformance(List<PerformanceResponse> performance) { this.performance = performance; }

    // ----- Nested DTOs -----

    /**
     * KPI summary: totalEmployees, growthRate, totalSalary, avgSalary,
     * totalLeave, leaveChange, dividend, dividendChange.
     */
    public static class KPIResponse {
        private int totalEmployees;
        private double growthRate;
        private double totalSalary;
        private double avgSalary;
        private int totalLeave;
        private double leaveChange;
        private double dividend;
        private double dividendChange;

        public int getTotalEmployees() { return totalEmployees; }
        public void setTotalEmployees(int totalEmployees) { this.totalEmployees = totalEmployees; }

        public double getGrowthRate() { return growthRate; }
        public void setGrowthRate(double growthRate) { this.growthRate = growthRate; }

        public double getTotalSalary() { return totalSalary; }
        public void setTotalSalary(double totalSalary) { this.totalSalary = totalSalary; }

        public double getAvgSalary() { return avgSalary; }
        public void setAvgSalary(double avgSalary) { this.avgSalary = avgSalary; }

        public int getTotalLeave() { return totalLeave; }
        public void setTotalLeave(int totalLeave) { this.totalLeave = totalLeave; }

        public double getLeaveChange() { return leaveChange; }
        public void setLeaveChange(double leaveChange) { this.leaveChange = leaveChange; }

        public double getDividend() { return dividend; }
        public void setDividend(double dividend) { this.dividend = dividend; }

        public double getDividendChange() { return dividendChange; }
        public void setDividendChange(double dividendChange) { this.dividendChange = dividendChange; }
    }

    /**
     * Per-department analytics row.
     */
    public static class DepartmentReportResponse {
        private String id;
        private String name;
        private int employees;
        private double totalSalary;
        private double avgSalary;
        private int leaveDays;
        private double performance;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public int getEmployees() { return employees; }
        public void setEmployees(int employees) { this.employees = employees; }

        public double getTotalSalary() { return totalSalary; }
        public void setTotalSalary(double totalSalary) { this.totalSalary = totalSalary; }

        public double getAvgSalary() { return avgSalary; }
        public void setAvgSalary(double avgSalary) { this.avgSalary = avgSalary; }

        public int getLeaveDays() { return leaveDays; }
        public void setLeaveDays(int leaveDays) { this.leaveDays = leaveDays; }

        public double getPerformance() { return performance; }
        public void setPerformance(double performance) { this.performance = performance; }
    }

    /**
     * Monthly salary trend data point.
     */
    public static class SalaryTrendResponse {
        private String month;
        private double amount;

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }

        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
    }

    /**
     * Employee status distribution.
     */
    public static class StatusDistributionResponse {
        private String status;
        private int count;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public int getCount() { return count; }
        public void setCount(int count) { this.count = count; }
    }

    /**
     * Leave type breakdown.
     */
    public static class LeaveTypeResponse {
        private String type;
        private int days;

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public int getDays() { return days; }
        public void setDays(int days) { this.days = days; }
    }

    /**
     * Monthly attendance rate.
     */
    public static class AttendanceRateResponse {
        private String month;
        private double rate;

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }

        public double getRate() { return rate; }
        public void setRate(double rate) { this.rate = rate; }
    }

    /**
     * Quarterly dividend trend.
     */
    public static class DividendTrendResponse {
        private String quarter;
        private double amount;

        public String getQuarter() { return quarter; }
        public void setQuarter(String quarter) { this.quarter = quarter; }

        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
    }

    /**
     * Department performance score.
     */
    public static class PerformanceResponse {
        private String department;
        private double score;

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }

        public double getScore() { return score; }
        public void setScore(double score) { this.score = score; }
    }
}
