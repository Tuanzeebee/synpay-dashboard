package com.companyx.synpay_dashboard.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.companyx.synpay_dashboard.dto.response.DashboardActivityResponse;
import com.companyx.synpay_dashboard.dto.response.DashboardAttendanceResponse;
import com.companyx.synpay_dashboard.dto.response.DashboardHrResponse;
import com.companyx.synpay_dashboard.dto.response.DashboardOverviewResponse;
import com.companyx.synpay_dashboard.dto.response.DashboardOverviewResponse.AlertItem;
import com.companyx.synpay_dashboard.dto.response.DashboardOverviewResponse.DonutItem;
import com.companyx.synpay_dashboard.dto.response.DashboardOverviewResponse.MonthValueItem;
import com.companyx.synpay_dashboard.dto.response.DashboardOverviewResponse.NameValueItem;
import com.companyx.synpay_dashboard.dto.response.DashboardPayrollResponse;
import com.companyx.synpay_dashboard.entity.auth.AuditLog;
import com.companyx.synpay_dashboard.repository.auth.AuditLogRepository;
import com.companyx.synpay_dashboard.repository.hr.DepartmentRepository;
import com.companyx.synpay_dashboard.repository.hr.EmployeeRepository;
import com.companyx.synpay_dashboard.repository.payroll.AttendanceRepository;
import com.companyx.synpay_dashboard.repository.payroll.SalaryRepository;

/**
 * Read-only service that aggregates data from HR, Payroll, and Auth databases
 * to produce dashboard overview responses.
 * <p>
 * This service <strong>never modifies</strong> any database records.
 * Results are cached in-memory with a configurable TTL to avoid
 * repeated heavy queries on every page load.
 */
@Service
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);

    /** Cache TTL in milliseconds (5 minutes). */
    private static final long CACHE_TTL_MS = 5 * 60 * 1000L;

    /** Vietnamese active employee statuses. */
    private static final List<String> ACTIVE_STATUSES = List.of("Đang làm việc", "Thử việc");

    /** Donut chart colour palette (matches frontend). */
    private static final String[] DONUT_COLORS = {
            "#3b82f6", "#22d3ee", "#818cf8", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#cbd5e1"
    };

    /**
     * Maps Vietnamese department names from the HR database to the frontend
     * translation keys used in {@code t("dept.{key}")}.
     */
    private static final Map<String, String> DEPT_NAME_TO_KEY = Map.ofEntries(
            Map.entry("Nhân Sự", "hr"),
            Map.entry("Tài Chính", "finance"),
            Map.entry("Kỹ Thuật", "engineering"),
            Map.entry("Kinh Doanh", "sales"),
            Map.entry("Hành Chính", "admin"),
            Map.entry("Marketing", "marketing"),
            Map.entry("Vận Hành", "operations"),
            Map.entry("Bảo Trì", "maintenance"),
            Map.entry("Nghiên Cứu", "rd"),
            Map.entry("Chăm Sóc Khách Hàng", "customer"),
            Map.entry("Hỗ Trợ", "support"),
            Map.entry("Pháp Lý", "legal"),
            Map.entry("Phòng Kinh Doanh", "sales"),
            Map.entry("Phòng Kế Toán", "accounting"),
            Map.entry("Phòng Bảo Trì", "maintenance"),
            Map.entry("Phòng Nhân Sự", "hr")
    );

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final SalaryRepository salaryRepository;
    private final AttendanceRepository attendanceRepository;
    private final AuditLogRepository auditLogRepository;

    /** Simple in-memory cache: key → (timestamp, value). */
    private final ConcurrentHashMap<String, CacheEntry<?>> cache = new ConcurrentHashMap<>();

    public DashboardService(EmployeeRepository employeeRepository,
                            DepartmentRepository departmentRepository,
                            SalaryRepository salaryRepository,
                            AttendanceRepository attendanceRepository,
                            AuditLogRepository auditLogRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.salaryRepository = salaryRepository;
        this.attendanceRepository = attendanceRepository;
        this.auditLogRepository = auditLogRepository;
    }

    // ════════════════════════════════════════════════════════════════
    //  GET /internal/dashboard/overview
    // ════════════════════════════════════════════════════════════════

    public DashboardOverviewResponse getOverview() {
        return cached("dashboard:overview", () -> {
            log.info("Building dashboard overview (cache miss)");

            DashboardOverviewResponse response = new DashboardOverviewResponse();
            response.setKpis(buildKpis());
            response.setDeptData(buildDepartmentDistribution());
            response.setHeadcountData(buildHeadcountTrend());
            response.setPayrollData(buildPayrollTrend());
            response.setPayrollDonutData(buildPayrollDonut());
            response.setAlerts(buildAlerts());
            return response;
        });
    }

    // ════════════════════════════════════════════════════════════════
    //  GET /internal/dashboard/hr
    // ════════════════════════════════════════════════════════════════

    public DashboardHrResponse getHrDashboard() {
        return cached("dashboard:hr", () -> {
            log.info("Building HR dashboard (cache miss)");

            long total = employeeRepository.count();
            long active = employeeRepository.countByStatusIn(ACTIVE_STATUSES);
            double growth = computeEmployeeGrowthPercent();

            DashboardHrResponse response = new DashboardHrResponse();
            response.setTotalEmployees((int) total);
            response.setActiveEmployees((int) active);
            response.setGrowthPercent(growth);
            response.setDepartmentDistribution(buildDepartmentDistribution());
            response.setHeadcountTrend(buildHeadcountTrend());
            return response;
        });
    }

    // ════════════════════════════════════════════════════════════════
    //  GET /internal/dashboard/payroll
    // ════════════════════════════════════════════════════════════════

    public DashboardPayrollResponse getPayrollDashboard() {
        return cached("dashboard:payroll", () -> {
            log.info("Building payroll dashboard (cache miss)");

            LocalDate currentMonth = currentSalaryMonth();
            BigDecimal totalPayroll = salaryRepository.sumNetSalaryByMonth(currentMonth);
            BigDecimal avgSalary = salaryRepository.avgNetSalaryByMonth(currentMonth);

            // Month-over-month growth
            LocalDate previousMonth = currentMonth.minusMonths(1);
            BigDecimal prevTotal = salaryRepository.sumNetSalaryByMonth(previousMonth);
            double changePercent = prevTotal.compareTo(BigDecimal.ZERO) > 0
                    ? totalPayroll.subtract(prevTotal)
                    .divide(prevTotal, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue()
                    : 0.0;

            DashboardPayrollResponse response = new DashboardPayrollResponse();
            response.setTotalPayroll(toMillions(totalPayroll));
            response.setAvgSalary(toMillions(avgSalary));
            response.setChangePercent(round(changePercent, 1));
            response.setPayrollTrend(buildPayrollTrend());
            response.setPayrollByDepartment(buildPayrollDonut());
            return response;
        });
    }

    // ════════════════════════════════════════════════════════════════
    //  GET /internal/dashboard/attendance
    // ════════════════════════════════════════════════════════════════

    public DashboardAttendanceResponse getAttendanceDashboard() {
        return cached("dashboard:attendance", () -> {
            log.info("Building attendance dashboard (cache miss)");

            LocalDate currentMonth = currentAttendanceMonth();
            int workDays = attendanceRepository.sumWorkDaysByMonth(currentMonth);
            int absentDays = attendanceRepository.sumAbsentDaysByMonth(currentMonth);
            int leaveDays = attendanceRepository.sumLeaveDaysByMonth(currentMonth);

            int totalScheduled = workDays + absentDays;
            double attendanceRate = totalScheduled > 0
                    ? (workDays * 100.0 / totalScheduled)
                    : 0.0;

            // Leave change vs previous month
            LocalDate prevMonth = currentMonth.minusMonths(1);
            int prevLeaveDays = attendanceRepository.sumLeaveDaysByMonth(prevMonth);
            double leaveChange = prevLeaveDays > 0
                    ? ((leaveDays - prevLeaveDays) * 100.0 / prevLeaveDays)
                    : 0.0;

            DashboardAttendanceResponse response = new DashboardAttendanceResponse();
            response.setAttendanceRate(round(attendanceRate, 1));
            response.setTotalLeaveDays(leaveDays);
            response.setTotalAbsentDays(absentDays);
            response.setTotalWorkDays(workDays);
            response.setLeaveChangePercent(round(leaveChange, 1));
            return response;
        });
    }

    // ════════════════════════════════════════════════════════════════
    //  GET /internal/dashboard/activity
    // ════════════════════════════════════════════════════════════════

    public DashboardActivityResponse getActivityDashboard() {
        return cached("dashboard:activity", () -> {
            log.info("Building activity dashboard (cache miss)");

            LocalDateTime since24h = LocalDateTime.now().minus(24, ChronoUnit.HOURS);
            long recentCount = auditLogRepository.countSince(since24h);
            List<AuditLog> recentLogs = auditLogRepository.findRecent(PageRequest.of(0, 20));

            List<DashboardActivityResponse.ActivityItem> items = recentLogs.stream()
                    .map(this::toActivityItem)
                    .toList();

            DashboardActivityResponse response = new DashboardActivityResponse();
            response.setTotalRecentActions((int) recentCount);
            response.setRecentActivities(items);
            return response;
        });
    }

    // ════════════════════════════════════════════════════════════════
    //  KPI Builder
    // ════════════════════════════════════════════════════════════════

    private DashboardOverviewResponse.KpiSummary buildKpis() {
        DashboardOverviewResponse.KpiSummary kpi = new DashboardOverviewResponse.KpiSummary();

        long total = employeeRepository.count();
        long active = employeeRepository.countByStatusIn(ACTIVE_STATUSES);
        kpi.setTotalEmployees((int) total);
        kpi.setActiveEmployees((int) active);
        kpi.setActivePercent(total > 0 ? round(active * 100.0 / total, 1) : 0);
        kpi.setEmployeeGrowthPercent(computeEmployeeGrowthPercent());

        // Payroll KPIs
        LocalDate currentMonth = currentSalaryMonth();
        BigDecimal monthlyPayroll = salaryRepository.sumNetSalaryByMonth(currentMonth);
        BigDecimal avgSalary = salaryRepository.avgNetSalaryByMonth(currentMonth);
        kpi.setMonthlyPayroll(toMillions(monthlyPayroll));
        kpi.setAvgSalary(toMillions(avgSalary));

        // Payroll growth
        LocalDate prevMonth = currentMonth.minusMonths(1);
        BigDecimal prevPayroll = salaryRepository.sumNetSalaryByMonth(prevMonth);
        double payrollGrowth = prevPayroll.compareTo(BigDecimal.ZERO) > 0
                ? monthlyPayroll.subtract(prevPayroll)
                .divide(prevPayroll, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue()
                : 0.0;
        kpi.setPayrollGrowthPercent(round(payrollGrowth, 1));

        // Attendance KPIs
        LocalDate attendMonth = currentAttendanceMonth();
        int leaveDays = attendanceRepository.sumLeaveDaysByMonth(attendMonth);
        kpi.setLeaveDays(leaveDays);

        LocalDate prevAttendMonth = attendMonth.minusMonths(1);
        int prevLeave = attendanceRepository.sumLeaveDaysByMonth(prevAttendMonth);
        double leaveGrowth = prevLeave > 0
                ? ((leaveDays - prevLeave) * 100.0 / prevLeave)
                : 0.0;
        kpi.setLeaveGrowthPercent(round(leaveGrowth, 1));

        // Alert count: audit entries from last 24h
        LocalDateTime since24h = LocalDateTime.now().minus(24, ChronoUnit.HOURS);
        kpi.setAlertCount((int) auditLogRepository.countSince(since24h));

        return kpi;
    }

    // ════════════════════════════════════════════════════════════════
    //  Chart Builders
    // ════════════════════════════════════════════════════════════════

    /**
     * Builds department distribution data for the bar chart.
     * Returns {@code [{ name: "engineering", value: 320 }, ...]}
     * where name is the frontend translation key.
     */
    private List<NameValueItem> buildDepartmentDistribution() {
        List<Object[]> rows = employeeRepository.countByDepartmentGrouped(ACTIVE_STATUSES);
        List<NameValueItem> result = new ArrayList<>();
        for (Object[] row : rows) {
            String deptName = (String) row[1];
            int count = ((Number) row[2]).intValue();
            String key = DEPT_NAME_TO_KEY.getOrDefault(deptName, deptName.toLowerCase().replaceAll("\\s+", "_"));
            result.add(new NameValueItem(key, count));
        }
        return result;
    }

    /**
     * Builds headcount trend over the last 12 months.
     * Returns {@code [{ month: "T1", value: 980 }, ...]}
     * with cumulative employee count at the end of each month.
     */
    private List<MonthValueItem> buildHeadcountTrend() {
        LocalDate now = LocalDate.now();
        List<MonthValueItem> result = new ArrayList<>();

        for (int i = 11; i >= 0; i--) {
            LocalDate monthEnd = now.minusMonths(i).withDayOfMonth(1).plusMonths(1).minusDays(1);
            long count = employeeRepository.countHiredOnOrBefore(monthEnd, ACTIVE_STATUSES);
            String label = "T" + monthEnd.getMonthValue();
            result.add(new MonthValueItem(label, count));
        }
        return result;
    }

    /**
     * Builds payroll trend over the last 12 months.
     * Returns {@code [{ month: "T1", value: 88.5 }, ...]}
     * where value is total net salary in billions VND.
     */
    private List<MonthValueItem> buildPayrollTrend() {
        LocalDate now = LocalDate.now();
        LocalDate startMonth = now.minusMonths(11).withDayOfMonth(1);
        LocalDate endMonth = now.withDayOfMonth(1);

        List<Object[]> rows = salaryRepository.sumNetSalaryGroupedByMonth(startMonth, endMonth);

        // Build a map for quick lookup
        Map<LocalDate, BigDecimal> monthMap = new LinkedHashMap<>();
        for (Object[] row : rows) {
            LocalDate month = (LocalDate) row[0];
            BigDecimal total = (BigDecimal) row[1];
            monthMap.put(month, total);
        }

        List<MonthValueItem> result = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate month = now.minusMonths(i).withDayOfMonth(1);
            BigDecimal total = monthMap.getOrDefault(month, BigDecimal.ZERO);
            String label = "T" + month.getMonthValue();
            // Convert to billions for display (chia tỷ)
            double billions = total.divide(BigDecimal.valueOf(1_000_000_000L), 2, RoundingMode.HALF_UP).doubleValue();
            result.add(new MonthValueItem(label, billions));
        }
        return result;
    }

    /**
     * Builds payroll distribution by department for the donut chart.
     * Returns {@code [{ name: "Kỹ Thuật", value: 45, color: "#3b82f6" }, ...]}
     * where value is a percentage of total payroll.
     */
    private List<DonutItem> buildPayrollDonut() {
        LocalDate currentMonth = currentSalaryMonth();
        List<Object[]> rows = salaryRepository.sumNetSalaryByDepartment(currentMonth);

        BigDecimal grandTotal = BigDecimal.ZERO;
        List<DeptPayrollEntry> entries = new ArrayList<>();

        // Resolve department names from the HR department repository
        Map<Integer, String> deptNames = new LinkedHashMap<>();
        departmentRepository.findAll().forEach(d -> deptNames.put(d.getDepartmentId(), d.getDepartmentName()));

        for (Object[] row : rows) {
            Integer deptId = ((Number) row[0]).intValue();
            BigDecimal total = (BigDecimal) row[1];
            grandTotal = grandTotal.add(total);
            String rawName = deptNames.getOrDefault(deptId, "Khác");
            String name = DEPT_NAME_TO_KEY.getOrDefault(rawName, rawName.equals("Khác") ? "others" : rawName.toLowerCase().replaceAll("\\s+", "_"));
            entries.add(new DeptPayrollEntry(name, total));
        }

        List<DonutItem> result = new ArrayList<>();
        BigDecimal othersTotal = BigDecimal.ZERO;
        int colorIdx = 0;

        // Show top departments, group small ones as "Khác"
        for (DeptPayrollEntry entry : entries) {
            double pct = grandTotal.compareTo(BigDecimal.ZERO) > 0
                    ? entry.total.divide(grandTotal, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue()
                    : 0.0;

            if (pct < 5.0 || colorIdx >= DONUT_COLORS.length - 1) {
                othersTotal = othersTotal.add(entry.total);
            } else {
                result.add(new DonutItem(entry.name, round(pct, 1), DONUT_COLORS[colorIdx++]));
            }
        }

        // Add "Khác" (Others) if there's a remainder
        if (othersTotal.compareTo(BigDecimal.ZERO) > 0 && grandTotal.compareTo(BigDecimal.ZERO) > 0) {
            double othersPct = othersTotal.divide(grandTotal, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).doubleValue();
            result.add(new DonutItem("others", round(othersPct, 1), DONUT_COLORS[DONUT_COLORS.length - 1]));
        }

        return result;
    }

    /**
     * Builds alert items from recent critical audit log entries.
     */
    private List<AlertItem> buildAlerts() {
        List<AuditLog> logs = auditLogRepository.findRecent(PageRequest.of(0, 10));
        List<AlertItem> result = new ArrayList<>();
        for (AuditLog l : logs) {
            String severity = isCriticalAction(l.getAction()) ? "Nghiêm Trọng" : "Cảnh Báo";
            String category = mapActionToCategory(l.getResource());
            String time = formatRelativeTime(l.getCreatedAt());
            result.add(new AlertItem(severity, category, l.getAction(),
                    l.getActionDescription() != null ? l.getActionDescription() : "", time));
        }
        return result;
    }

    // ════════════════════════════════════════════════════════════════
    //  Helpers
    // ════════════════════════════════════════════════════════════════

    private double computeEmployeeGrowthPercent() {
        LocalDate now = LocalDate.now();
        LocalDate endOfCurrentMonth = now.withDayOfMonth(1).plusMonths(1).minusDays(1);
        LocalDate endOfPreviousMonth = now.withDayOfMonth(1).minusDays(1);

        long currentCount = employeeRepository.countHiredOnOrBefore(endOfCurrentMonth, ACTIVE_STATUSES);
        long previousCount = employeeRepository.countHiredOnOrBefore(endOfPreviousMonth, ACTIVE_STATUSES);

        return previousCount > 0
                ? round((currentCount - previousCount) * 100.0 / previousCount, 1)
                : 0.0;
    }

    private LocalDate currentSalaryMonth() {
        return LocalDate.now().withDayOfMonth(1);
    }

    private LocalDate currentAttendanceMonth() {
        return LocalDate.now().withDayOfMonth(1);
    }

    private DashboardActivityResponse.ActivityItem toActivityItem(AuditLog l) {
        DashboardActivityResponse.ActivityItem item = new DashboardActivityResponse.ActivityItem();
        item.setAuditId(l.getAuditId());
        item.setActorEmail(l.getActorEmail());
        item.setActorRole(l.getActorRole());
        item.setAction(l.getAction());
        item.setResource(l.getResource());
        item.setResourceId(l.getResourceId());
        item.setDescription(l.getActionDescription());
        item.setIpAddress(l.getIpAddress());
        item.setCreatedAt(l.getCreatedAt());
        return item;
    }

    private boolean isCriticalAction(String action) {
        if (action == null) return false;
        return action.contains("DELETE") || action.contains("FAIL")
                || action.contains("DISABLE") || action.contains("DENY");
    }

    private String mapActionToCategory(String resource) {
        if (resource == null) return "Hệ Thống";
        return switch (resource.toLowerCase()) {
            case "account", "user" -> "Tài Khoản";
            case "role", "permission" -> "Phân Quyền";
            case "employee" -> "Nhân Sự";
            case "salary", "payroll" -> "Bảng Lương";
            case "attendance" -> "Chấm Công";
            default -> "Hệ Thống";
        };
    }

    private String formatRelativeTime(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        long minutes = ChronoUnit.MINUTES.between(dateTime, LocalDateTime.now());
        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return minutes + " phút trước";
        long hours = minutes / 60;
        if (hours < 24) return hours + " giờ trước";
        long days = hours / 24;
        return days + " ngày trước";
    }

    private static double toMillions(BigDecimal value) {
        if (value == null) return 0.0;
        return value.divide(BigDecimal.valueOf(1_000_000L), 2, RoundingMode.HALF_UP).doubleValue();
    }

    private static double round(double value, int decimals) {
        return BigDecimal.valueOf(value).setScale(decimals, RoundingMode.HALF_UP).doubleValue();
    }

    // ════════════════════════════════════════════════════════════════
    //  Cache
    // ════════════════════════════════════════════════════════════════

    @SuppressWarnings("unchecked")
    private <T> T cached(String key, java.util.function.Supplier<T> loader) {
        CacheEntry<?> entry = cache.get(key);
        if (entry != null && !entry.isExpired()) {
            log.debug("Cache hit for key '{}'", key);
            return (T) entry.value;
        }
        T value = loader.get();
        cache.put(key, new CacheEntry<>(value));
        return value;
    }

    private static class CacheEntry<T> {
        final T value;
        final long createdAt;

        CacheEntry(T value) {
            this.value = value;
            this.createdAt = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - createdAt > CACHE_TTL_MS;
        }
    }

    private record DeptPayrollEntry(String name, BigDecimal total) {}
}
