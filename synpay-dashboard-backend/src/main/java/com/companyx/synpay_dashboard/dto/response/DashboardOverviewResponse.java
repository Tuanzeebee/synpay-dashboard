package com.companyx.synpay_dashboard.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO for {@code GET /internal/dashboard/overview}.
 * <p>
 * Contains all data needed by the frontend Dashboard Overview page:
 * KPI summary cards, chart datasets, and recent alerts.
 * <p>
 * Field names and structures match the frontend component props exactly.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardOverviewResponse {

    private KpiSummary kpis;
    private List<NameValueItem> deptData;
    private List<MonthValueItem> headcountData;
    private List<MonthValueItem> payrollData;
    private List<DonutItem> payrollDonutData;
    private List<AlertItem> alerts;

    // ── KPI Summary (maps to 6 KPI cards) ────────────────────────

    public static class KpiSummary {
        private int totalEmployees;
        private int activeEmployees;
        private double activePercent;
        private double monthlyPayroll;
        private double avgSalary;
        private int leaveDays;
        private int alertCount;
        private double employeeGrowthPercent;
        private double payrollGrowthPercent;
        private double leaveGrowthPercent;

        public int getTotalEmployees() { return totalEmployees; }
        public void setTotalEmployees(int totalEmployees) { this.totalEmployees = totalEmployees; }

        public int getActiveEmployees() { return activeEmployees; }
        public void setActiveEmployees(int activeEmployees) { this.activeEmployees = activeEmployees; }

        public double getActivePercent() { return activePercent; }
        public void setActivePercent(double activePercent) { this.activePercent = activePercent; }

        public double getMonthlyPayroll() { return monthlyPayroll; }
        public void setMonthlyPayroll(double monthlyPayroll) { this.monthlyPayroll = monthlyPayroll; }

        public double getAvgSalary() { return avgSalary; }
        public void setAvgSalary(double avgSalary) { this.avgSalary = avgSalary; }

        public int getLeaveDays() { return leaveDays; }
        public void setLeaveDays(int leaveDays) { this.leaveDays = leaveDays; }

        public int getAlertCount() { return alertCount; }
        public void setAlertCount(int alertCount) { this.alertCount = alertCount; }

        public double getEmployeeGrowthPercent() { return employeeGrowthPercent; }
        public void setEmployeeGrowthPercent(double employeeGrowthPercent) { this.employeeGrowthPercent = employeeGrowthPercent; }

        public double getPayrollGrowthPercent() { return payrollGrowthPercent; }
        public void setPayrollGrowthPercent(double payrollGrowthPercent) { this.payrollGrowthPercent = payrollGrowthPercent; }

        public double getLeaveGrowthPercent() { return leaveGrowthPercent; }
        public void setLeaveGrowthPercent(double leaveGrowthPercent) { this.leaveGrowthPercent = leaveGrowthPercent; }
    }

    // ── Chart item types (match frontend recharts data format) ───

    /** Bar chart item: { name, value } — used by department distribution. */
    public static class NameValueItem {
        private String name;
        private int value;

        public NameValueItem() {}

        public NameValueItem(String name, int value) {
            this.name = name;
            this.value = value;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public int getValue() { return value; }
        public void setValue(int value) { this.value = value; }
    }

    /** Area chart item: { month, value } — used by headcount & payroll trends. */
    public static class MonthValueItem {
        private String month;
        private double value;

        public MonthValueItem() {}

        public MonthValueItem(String month, double value) {
            this.month = month;
            this.value = value;
        }

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }

        public double getValue() { return value; }
        public void setValue(double value) { this.value = value; }
    }

    /** Donut/pie chart item: { name, value, color } — used by payroll-by-department. */
    public static class DonutItem {
        private String name;
        private double value;
        private String color;

        public DonutItem() {}

        public DonutItem(String name, double value, String color) {
            this.name = name;
            this.value = value;
            this.color = color;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public double getValue() { return value; }
        public void setValue(double value) { this.value = value; }

        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }

    /** Alert item — displayed in the alerts panel. */
    public static class AlertItem {
        private String severity;
        private String category;
        private String title;
        private String description;
        private String time;

        public AlertItem() {}

        public AlertItem(String severity, String category, String title, String description, String time) {
            this.severity = severity;
            this.category = category;
            this.title = title;
            this.description = description;
            this.time = time;
        }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getTime() { return time; }
        public void setTime(String time) { this.time = time; }
    }

    // ── Root getters & setters ───────────────────────────────────

    public KpiSummary getKpis() { return kpis; }
    public void setKpis(KpiSummary kpis) { this.kpis = kpis; }

    public List<NameValueItem> getDeptData() { return deptData; }
    public void setDeptData(List<NameValueItem> deptData) { this.deptData = deptData; }

    public List<MonthValueItem> getHeadcountData() { return headcountData; }
    public void setHeadcountData(List<MonthValueItem> headcountData) { this.headcountData = headcountData; }

    public List<MonthValueItem> getPayrollData() { return payrollData; }
    public void setPayrollData(List<MonthValueItem> payrollData) { this.payrollData = payrollData; }

    public List<DonutItem> getPayrollDonutData() { return payrollDonutData; }
    public void setPayrollDonutData(List<DonutItem> payrollDonutData) { this.payrollDonutData = payrollDonutData; }

    public List<AlertItem> getAlerts() { return alerts; }
    public void setAlerts(List<AlertItem> alerts) { this.alerts = alerts; }
}
