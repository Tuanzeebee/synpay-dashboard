package com.companyx.synpay_dashboard.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.companyx.synpay_dashboard.dto.response.AttendanceReportResponse;
import com.companyx.synpay_dashboard.dto.response.DashboardReportResponse;
import com.companyx.synpay_dashboard.dto.response.HrReportResponse;
import com.companyx.synpay_dashboard.dto.response.PayrollReportResponse;
import com.companyx.synpay_dashboard.dto.response.ReportsDataResponse;
import com.companyx.synpay_dashboard.dto.response.ReportsDataResponse.AttendanceRateResponse;
import com.companyx.synpay_dashboard.dto.response.ReportsDataResponse.DepartmentReportResponse;
import com.companyx.synpay_dashboard.dto.response.ReportsDataResponse.DividendTrendResponse;
import com.companyx.synpay_dashboard.dto.response.ReportsDataResponse.KPIResponse;
import com.companyx.synpay_dashboard.dto.response.ReportsDataResponse.LeaveTypeResponse;
import com.companyx.synpay_dashboard.dto.response.ReportsDataResponse.PerformanceResponse;
import com.companyx.synpay_dashboard.dto.response.ReportsDataResponse.SalaryTrendResponse;
import com.companyx.synpay_dashboard.dto.response.ReportsDataResponse.StatusDistributionResponse;
import com.companyx.synpay_dashboard.entity.hr.Department;
import com.companyx.synpay_dashboard.entity.hr.Employee;
import com.companyx.synpay_dashboard.entity.payroll.AttendanceRecord;
import com.companyx.synpay_dashboard.entity.payroll.Salary;
import com.companyx.synpay_dashboard.repository.hr.DepartmentRepository;
import com.companyx.synpay_dashboard.repository.hr.DividendRepository;
import com.companyx.synpay_dashboard.repository.hr.EmployeeRepository;
import com.companyx.synpay_dashboard.repository.payroll.AttendanceRepository;
import com.companyx.synpay_dashboard.repository.payroll.SalaryRepository;

/**
 * Read-only service that aggregates data from HR and Payroll databases
 * to produce the Reports &amp; Analytics response.
 *
 * <p>This service <strong>never modifies</strong> any database records.</p>
 */
@Service
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);

    // Vietnamese status → frontend key mapping
    private static final Map<String, String> STATUS_MAP = Map.of(
            "Đang làm việc", "active",
            "Nghỉ phép", "onLeave",
            "Thử việc", "probation",
            "Thực tập", "intern"
    );

    // Department ID → frontend key mapping
    private static final Map<Integer, String> DEPT_KEY_MAP = Map.ofEntries(
            Map.entry(1, "hr"),
            Map.entry(2, "finance"),
            Map.entry(3, "tech"),
            Map.entry(4, "sales"),
            Map.entry(5, "admin"),
            Map.entry(6, "marketing"),
            Map.entry(7, "operations"),
            Map.entry(8, "maintenance"),
            Map.entry(9, "rd"),
            Map.entry(10, "customer")
    );

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final SalaryRepository salaryRepository;
    private final AttendanceRepository attendanceRepository;
    private final DividendRepository dividendRepository;

    public ReportService(EmployeeRepository employeeRepository,
                         DepartmentRepository departmentRepository,
                         SalaryRepository salaryRepository,
                         AttendanceRepository attendanceRepository,
                         DividendRepository dividendRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.salaryRepository = salaryRepository;
        this.attendanceRepository = attendanceRepository;
        this.dividendRepository = dividendRepository;
    }

    /**
     * Build the full reports data response.
     *
     * @param department optional department filter (frontend key like "tech", "hr" or null for all)
     * @param startDate  period start (inclusive)
     * @param endDate    period end (inclusive)
     */
    public ReportsDataResponse getReportsData(String department, LocalDate startDate, LocalDate endDate) {
        log.info("Building reports data: department={}, start={}, end={}", department, startDate, endDate);

        Integer departmentId = resolveDepartmentId(department);

        // Fetch raw data
        List<Employee> employees = fetchEmployees();
        List<Department> departments = fetchDepartments();
        List<Salary> salaries = fetchSalaries(departmentId, startDate, endDate);
        List<AttendanceRecord> attendanceRecords = fetchAttendance(departmentId, startDate, endDate);

        // Filter employees by department if needed
        if (departmentId != null) {
            employees = employees.stream()
                    .filter(e -> e.getDepartment() != null
                            && departmentId.equals(e.getDepartment().getDepartmentId()))
                    .toList();
        }

        ReportsDataResponse response = new ReportsDataResponse();
        response.setKpis(buildKPIs(employees, salaries, attendanceRecords, startDate, endDate));
        response.setDepartments(buildDepartmentData(departments, employees, salaries, attendanceRecords));
        response.setSalaryTrend(buildSalaryTrend(salaries, startDate, endDate));
        response.setStatusDistribution(buildStatusDistribution(employees));
        response.setLeaveTypes(buildLeaveTypes(attendanceRecords));
        response.setAttendance(buildAttendanceRates(attendanceRecords, startDate, endDate));
        response.setDividends(buildDividendTrend(startDate, endDate));
        response.setPerformance(buildPerformance(departments, employees, attendanceRecords));

        return response;
    }

    // ========== KPIs ==========

    private KPIResponse buildKPIs(List<Employee> employees, List<Salary> salaries,
                                  List<AttendanceRecord> attendanceRecords,
                                  LocalDate startDate, LocalDate endDate) {
        KPIResponse kpi = new KPIResponse();

        int totalEmployees = employees.size();
        kpi.setTotalEmployees(totalEmployees);

        // Growth rate: compare current employee count vs 6 months prior
        // Simplified: percentage of recently hired employees (within last 6 months of endDate)
        LocalDate sixMonthsAgo = endDate.minusMonths(6);
        long newHires = employees.stream()
                .filter(e -> e.getHireDate() != null && e.getHireDate().isAfter(sixMonthsAgo))
                .count();
        double growthRate = totalEmployees > 0 ? (newHires * 100.0 / totalEmployees) : 0;
        kpi.setGrowthRate(round(growthRate, 1));

        // Total salary (in triệu VND = millions)
        BigDecimal totalSalarySum = salaries.stream()
                .map(Salary::getNetSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        double totalSalaryMillion = totalSalarySum.doubleValue() / 1_000_000.0;
        kpi.setTotalSalary(round(totalSalaryMillion, 1));

        // Average salary (in triệu VND = millions)
        double avgSalaryMillion = totalEmployees > 0
                ? (totalSalarySum.doubleValue() / totalEmployees) / 1_000_000.0
                : 0;
        kpi.setAvgSalary(round(avgSalaryMillion, 1));

        // Total leave days
        int totalLeave = attendanceRecords.stream()
                .mapToInt(a -> safeInt(a.getLeaveDays()))
                .sum();
        kpi.setTotalLeave(totalLeave);

        // Leave change: simplified as percentage vs absent days
        int totalAbsent = attendanceRecords.stream()
                .mapToInt(a -> safeInt(a.getAbsentDays()))
                .sum();
        double leaveChange = totalLeave > 0
                ? ((totalAbsent - totalLeave) * 100.0 / totalLeave)
                : 0;
        kpi.setLeaveChange(round(leaveChange, 1));

        // Dividends (in triệu VND = millions)
        BigDecimal divTotal = dividendRepository.sumInRange(startDate, endDate);
        double divMillion = divTotal.doubleValue() / 1_000_000.0;
        kpi.setDividend(round(divMillion, 1));

        // Dividend change: compare current quarter vs previous quarter
        int currentQuarter = (endDate.getMonthValue() - 1) / 3 + 1;
        LocalDate currentQStart = LocalDate.of(endDate.getYear(), (currentQuarter - 1) * 3 + 1, 1);
        LocalDate currentQEnd = currentQStart.plusMonths(3).minusDays(1);
        LocalDate prevQStart = currentQStart.minusMonths(3);
        LocalDate prevQEnd = currentQStart.minusDays(1);
        BigDecimal currentQDiv = dividendRepository.sumInRange(currentQStart, currentQEnd);
        BigDecimal prevQDiv = dividendRepository.sumInRange(prevQStart, prevQEnd);
        double dividendChange = prevQDiv.compareTo(BigDecimal.ZERO) > 0
                ? ((currentQDiv.doubleValue() - prevQDiv.doubleValue()) / prevQDiv.doubleValue()) * 100.0
                : 0;
        kpi.setDividendChange(round(dividendChange, 1));

        return kpi;
    }

    // ========== Department Data ==========

    private List<DepartmentReportResponse> buildDepartmentData(
            List<Department> departments, List<Employee> employees,
            List<Salary> salaries, List<AttendanceRecord> attendanceRecords) {

        // Group employees by department
        Map<Integer, List<Employee>> empByDept = new HashMap<>();
        for (Employee emp : employees) {
            if (emp.getDepartment() != null) {
                empByDept.computeIfAbsent(emp.getDepartment().getDepartmentId(), k -> new ArrayList<>())
                         .add(emp);
            }
        }

        // Group salaries by department
        Map<Integer, List<Salary>> salByDept = new HashMap<>();
        for (Salary sal : salaries) {
            if (sal.getEmployee() != null && sal.getEmployee().getDepartmentId() != null) {
                salByDept.computeIfAbsent(sal.getEmployee().getDepartmentId(), k -> new ArrayList<>())
                         .add(sal);
            }
        }

        // Group attendance by department
        Map<Integer, List<AttendanceRecord>> attByDept = new HashMap<>();
        for (AttendanceRecord att : attendanceRecords) {
            if (att.getEmployee() != null && att.getEmployee().getDepartmentId() != null) {
                attByDept.computeIfAbsent(att.getEmployee().getDepartmentId(), k -> new ArrayList<>())
                         .add(att);
            }
        }

        List<DepartmentReportResponse> result = new ArrayList<>();
        for (Department dept : departments) {
            DepartmentReportResponse row = new DepartmentReportResponse();
            int deptId = dept.getDepartmentId();
            String key = DEPT_KEY_MAP.getOrDefault(deptId, "dept_" + deptId);

            row.setId(key);
            row.setName(dept.getDepartmentName());

            List<Employee> deptEmployees = empByDept.getOrDefault(deptId, List.of());
            row.setEmployees(deptEmployees.size());

            List<Salary> deptSalaries = salByDept.getOrDefault(deptId, List.of());
            BigDecimal deptTotalSalary = deptSalaries.stream()
                    .map(Salary::getNetSalary)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            // totalSalary in triệu (millions) for the table
            double totalSalaryMillion = deptTotalSalary.doubleValue() / 1_000_000.0;
            row.setTotalSalary(round(totalSalaryMillion, 0));

            double avgSalary = deptEmployees.isEmpty() ? 0
                    : (deptTotalSalary.doubleValue() / deptEmployees.size()) / 1_000_000.0;
            row.setAvgSalary(round(avgSalary, 0));

            List<AttendanceRecord> deptAttendance = attByDept.getOrDefault(deptId, List.of());
            int leaveDays = deptAttendance.stream()
                    .mapToInt(a -> safeInt(a.getLeaveDays()))
                    .sum();
            row.setLeaveDays(leaveDays);

            // Performance score based on attendance rate
            int totalWorkDays = deptAttendance.stream().mapToInt(a -> safeInt(a.getWorkDays())).sum();
            int totalAbsent = deptAttendance.stream().mapToInt(a -> safeInt(a.getAbsentDays())).sum();
            double performance = totalWorkDays > 0
                    ? ((double) (totalWorkDays - totalAbsent) / totalWorkDays) * 100.0
                    : 0;
            row.setPerformance(round(performance, 0));

            result.add(row);
        }

        return result;
    }

    // ========== Salary Trend ==========

    private List<SalaryTrendResponse> buildSalaryTrend(List<Salary> salaries,
                                                        LocalDate startDate, LocalDate endDate) {
        // Group salary totals by year-month key to avoid duplicates across years
        Map<String, BigDecimal> monthlyTotals = new HashMap<>();
        for (Salary sal : salaries) {
            LocalDate month = sal.getSalaryMonth();
            String key = "T" + month.getMonthValue() + "/" + month.getYear();
            monthlyTotals.merge(key, sal.getNetSalary(), BigDecimal::add);
        }

        // Build trend for full date range
        List<SalaryTrendResponse> trend = new ArrayList<>();
        LocalDate cursor = startDate.withDayOfMonth(1);
        while (!cursor.isAfter(endDate)) {
            String key = "T" + cursor.getMonthValue() + "/" + cursor.getYear();
            SalaryTrendResponse point = new SalaryTrendResponse();
            point.setMonth(key);
            BigDecimal total = monthlyTotals.getOrDefault(key, BigDecimal.ZERO);
            // In triệu (millions)
            point.setAmount(round(total.doubleValue() / 1_000_000.0, 1));
            trend.add(point);
            cursor = cursor.plusMonths(1);
        }

        return trend;
    }

    // ========== Status Distribution ==========

    private List<StatusDistributionResponse> buildStatusDistribution(List<Employee> employees) {
        Map<String, Integer> counts = new LinkedHashMap<>();

        for (Employee emp : employees) {
            String mapped = STATUS_MAP.getOrDefault(emp.getStatus(), "active");
            counts.merge(mapped, 1, Integer::sum);
        }

        List<StatusDistributionResponse> result = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : counts.entrySet()) {
            StatusDistributionResponse item = new StatusDistributionResponse();
            item.setStatus(entry.getKey());
            item.setCount(entry.getValue());
            result.add(item);
        }
        // Sort descending by count
        result.sort((a, b) -> Integer.compare(b.getCount(), a.getCount()));
        return result;
    }

    // ========== Leave Types ==========

    private List<LeaveTypeResponse> buildLeaveTypes(List<AttendanceRecord> attendanceRecords) {
        // With current schema, we only have LeaveDays and AbsentDays
        // Map them to the frontend categories
        int totalLeave = attendanceRecords.stream().mapToInt(a -> safeInt(a.getLeaveDays())).sum();
        int totalAbsent = attendanceRecords.stream().mapToInt(a -> safeInt(a.getAbsentDays())).sum();

        // Distribute across leave types proportionally
        List<LeaveTypeResponse> result = new ArrayList<>();

        LeaveTypeResponse annual = new LeaveTypeResponse();
        annual.setType("annual");
        annual.setDays(totalLeave);
        result.add(annual);

        LeaveTypeResponse sick = new LeaveTypeResponse();
        sick.setType("sick");
        sick.setDays(totalAbsent);
        result.add(sick);

        // These are 0 since we don't have granular leave type data
        LeaveTypeResponse maternity = new LeaveTypeResponse();
        maternity.setType("maternity");
        maternity.setDays(0);
        result.add(maternity);

        LeaveTypeResponse unpaid = new LeaveTypeResponse();
        unpaid.setType("unpaid");
        unpaid.setDays(0);
        result.add(unpaid);

        LeaveTypeResponse other = new LeaveTypeResponse();
        other.setType("other");
        other.setDays(0);
        result.add(other);

        return result;
    }

    // ========== Attendance Rates ==========

    private List<AttendanceRateResponse> buildAttendanceRates(List<AttendanceRecord> attendanceRecords,
                                                               LocalDate startDate, LocalDate endDate) {
        // Group by year-month key to avoid duplicates across years
        Map<String, int[]> monthlyStats = new HashMap<>(); // [workDays, absentDays]

        for (AttendanceRecord a : attendanceRecords) {
            LocalDate m = a.getAttendanceMonth();
            String key = "T" + m.getMonthValue() + "/" + m.getYear();
            int[] stats = monthlyStats.computeIfAbsent(key, k -> new int[]{0, 0});
            stats[0] += safeInt(a.getWorkDays());
            stats[1] += safeInt(a.getAbsentDays());
        }

        // Build trend for full date range
        List<AttendanceRateResponse> result = new ArrayList<>();
        LocalDate cursor = startDate.withDayOfMonth(1);
        while (!cursor.isAfter(endDate)) {
            String key = "T" + cursor.getMonthValue() + "/" + cursor.getYear();
            int[] stats = monthlyStats.getOrDefault(key, new int[]{0, 0});
            AttendanceRateResponse point = new AttendanceRateResponse();
            point.setMonth(key);
            int total = stats[0] + stats[1];
            double rate = total > 0 ? (stats[0] * 100.0 / total) : 0;
            point.setRate(round(rate, 1));
            result.add(point);
            cursor = cursor.plusMonths(1);
        }

        return result;
    }

    // ========== Dividend Trend ==========

    private List<DividendTrendResponse> buildDividendTrend(LocalDate startDate, LocalDate endDate) {
        List<Object[]> rows = dividendRepository.sumByQuarter(startDate, endDate);
        List<DividendTrendResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            DividendTrendResponse item = new DividendTrendResponse();
            int year = ((Number) row[0]).intValue();
            int quarter = ((Number) row[1]).intValue();
            BigDecimal amount = (BigDecimal) row[2];
            item.setQuarter("Q" + quarter + " " + year);
            // In triệu (millions)
            item.setAmount(round(amount.doubleValue() / 1_000_000.0, 1));
            result.add(item);
        }
        return result;
    }

    // ========== Performance ==========

    private List<PerformanceResponse> buildPerformance(List<Department> departments,
                                                        List<Employee> employees,
                                                        List<AttendanceRecord> attendanceRecords) {
        // Group attendance by department
        Map<Integer, int[]> deptStats = new HashMap<>(); // [workDays, absentDays]
        for (AttendanceRecord a : attendanceRecords) {
            if (a.getEmployee() != null && a.getEmployee().getDepartmentId() != null) {
                int deptId = a.getEmployee().getDepartmentId();
                int[] stats = deptStats.computeIfAbsent(deptId, k -> new int[]{0, 0});
                stats[0] += safeInt(a.getWorkDays());
                stats[1] += safeInt(a.getAbsentDays());
            }
        }

        List<PerformanceResponse> result = new ArrayList<>();
        for (Department dept : departments) {
            int deptId = dept.getDepartmentId();
            String key = DEPT_KEY_MAP.getOrDefault(deptId, "dept_" + deptId);
            int[] stats = deptStats.getOrDefault(deptId, new int[]{0, 0});
            int total = stats[0] + stats[1];
            double score = total > 0 ? (stats[0] * 100.0 / total) : 0;

            PerformanceResponse perf = new PerformanceResponse();
            perf.setDepartment(key);
            perf.setScore(round(score, 0));
            result.add(perf);
        }

        return result;
    }

    // ========== Sub-Report Methods ==========

    /**
     * Dashboard overview: high-level KPIs across the whole organisation.
     */
    public DashboardReportResponse getDashboardReport(LocalDate startDate, LocalDate endDate) {
        log.info("Building dashboard report: start={}, end={}", startDate, endDate);

        List<Employee> employees = fetchEmployees();
        List<Department> departments = fetchDepartments();
        List<Salary> salaries = fetchSalaries(null, startDate, endDate);
        List<AttendanceRecord> attendanceRecords = fetchAttendance(null, startDate, endDate);

        KPIResponse kpi = buildKPIs(employees, salaries, attendanceRecords, startDate, endDate);

        // Overall attendance rate
        int totalWork = attendanceRecords.stream().mapToInt(a -> safeInt(a.getWorkDays())).sum();
        int totalAbsent = attendanceRecords.stream().mapToInt(a -> safeInt(a.getAbsentDays())).sum();
        int totalAll = totalWork + totalAbsent;
        double attendanceRate = totalAll > 0 ? (totalWork * 100.0 / totalAll) : 0;

        // Latest month payroll total (in triệu)
        BigDecimal latestMonthTotal = salaries.stream()
                .filter(s -> s.getSalaryMonth().getMonth() == endDate.getMonth()
                        && s.getSalaryMonth().getYear() == endDate.getYear())
                .map(Salary::getNetSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        double payrollThisMonth = latestMonthTotal.doubleValue() / 1_000_000.0;

        DashboardReportResponse resp = new DashboardReportResponse();
        resp.setTotalEmployees(employees.size());
        resp.setTotalDepartments(departments.size());
        resp.setPayrollTotalThisMonth(round(payrollThisMonth, 1));
        resp.setAttendanceRate(round(attendanceRate, 1));
        resp.setGrowthRate(kpi.getGrowthRate());
        resp.setAvgSalary(kpi.getAvgSalary());
        resp.setStatusDistribution(buildStatusDistribution(employees));
        resp.setPerformance(buildPerformance(departments, employees, attendanceRecords));
        return resp;
    }

    /**
     * HR-focused report: employees, growth, status, per-department breakdown.
     */
    public HrReportResponse getHrReport(String department, LocalDate startDate, LocalDate endDate) {
        log.info("Building HR report: department={}, start={}, end={}", department, startDate, endDate);

        Integer departmentId = resolveDepartmentId(department);
        List<Employee> employees = fetchEmployees();
        List<Department> departments = fetchDepartments();
        List<Salary> salaries = fetchSalaries(departmentId, startDate, endDate);
        List<AttendanceRecord> attendanceRecords = fetchAttendance(departmentId, startDate, endDate);

        if (departmentId != null) {
            employees = employees.stream()
                    .filter(e -> e.getDepartment() != null
                            && departmentId.equals(e.getDepartment().getDepartmentId()))
                    .toList();
        }

        KPIResponse kpi = buildKPIs(employees, salaries, attendanceRecords, startDate, endDate);

        HrReportResponse resp = new HrReportResponse();
        resp.setTotalEmployees(employees.size());
        resp.setGrowthRate(kpi.getGrowthRate());
        resp.setDepartments(buildDepartmentData(departments, employees, salaries, attendanceRecords));
        resp.setStatusDistribution(buildStatusDistribution(employees));
        resp.setPerformance(buildPerformance(departments, employees, attendanceRecords));
        return resp;
    }

    /**
     * Payroll-focused report: salary totals, trend, dividends, per-department.
     */
    public PayrollReportResponse getPayrollReport(String department, LocalDate startDate, LocalDate endDate) {
        log.info("Building payroll report: department={}, start={}, end={}", department, startDate, endDate);

        Integer departmentId = resolveDepartmentId(department);
        List<Employee> employees = fetchEmployees();
        List<Department> departments = fetchDepartments();
        List<Salary> salaries = fetchSalaries(departmentId, startDate, endDate);
        List<AttendanceRecord> attendanceRecords = fetchAttendance(departmentId, startDate, endDate);

        if (departmentId != null) {
            employees = employees.stream()
                    .filter(e -> e.getDepartment() != null
                            && departmentId.equals(e.getDepartment().getDepartmentId()))
                    .toList();
        }

        KPIResponse kpi = buildKPIs(employees, salaries, attendanceRecords, startDate, endDate);

        PayrollReportResponse resp = new PayrollReportResponse();
        resp.setTotalSalary(kpi.getTotalSalary());
        resp.setAvgSalary(kpi.getAvgSalary());
        resp.setSalaryTrend(buildSalaryTrend(salaries, startDate, endDate));
        resp.setDepartments(buildDepartmentData(departments, employees, salaries, attendanceRecords));
        resp.setDividends(buildDividendTrend(startDate, endDate));
        return resp;
    }

    /**
     * Attendance-focused report: rates, leave days, leave types.
     */
    public AttendanceReportResponse getAttendanceReport(String department, LocalDate startDate, LocalDate endDate) {
        log.info("Building attendance report: department={}, start={}, end={}", department, startDate, endDate);

        Integer departmentId = resolveDepartmentId(department);
        List<Employee> employees = fetchEmployees();
        List<Salary> salaries = fetchSalaries(departmentId, startDate, endDate);
        List<AttendanceRecord> attendanceRecords = fetchAttendance(departmentId, startDate, endDate);

        if (departmentId != null) {
            employees = employees.stream()
                    .filter(e -> e.getDepartment() != null
                            && departmentId.equals(e.getDepartment().getDepartmentId()))
                    .toList();
        }

        KPIResponse kpi = buildKPIs(employees, salaries, attendanceRecords, startDate, endDate);

        // Overall attendance rate
        int totalWork = attendanceRecords.stream().mapToInt(a -> safeInt(a.getWorkDays())).sum();
        int totalAbsent = attendanceRecords.stream().mapToInt(a -> safeInt(a.getAbsentDays())).sum();
        int totalAll = totalWork + totalAbsent;
        double attendanceRate = totalAll > 0 ? (totalWork * 100.0 / totalAll) : 0;

        AttendanceReportResponse resp = new AttendanceReportResponse();
        resp.setOverallAttendanceRate(round(attendanceRate, 1));
        resp.setTotalLeave(kpi.getTotalLeave());
        resp.setLeaveChange(kpi.getLeaveChange());
        resp.setAttendance(buildAttendanceRates(attendanceRecords, startDate, endDate));
        resp.setLeaveTypes(buildLeaveTypes(attendanceRecords));
        return resp;
    }

    /**
     * Dividends-only report (for the /reports/dividends endpoint).
     */
    public List<DividendTrendResponse> getDividendsReport(LocalDate startDate, LocalDate endDate) {
        log.info("Building dividends report: start={}, end={}", startDate, endDate);
        return buildDividendTrend(startDate, endDate);
    }

    // ========== Data Fetching ==========

    private List<Employee> fetchEmployees() {
        return employeeRepository.findAll();
    }

    private List<Department> fetchDepartments() {
        return departmentRepository.findAll();
    }

    private List<Salary> fetchSalaries(Integer departmentId, LocalDate startDate, LocalDate endDate) {
        // Fetch all salaries within range; filter by department done in-memory via employee
        List<Salary> all = salaryRepository.findAllFiltered(null, departmentId, null);
        return all.stream()
                .filter(s -> !s.getSalaryMonth().isBefore(startDate) && !s.getSalaryMonth().isAfter(endDate))
                .toList();
    }

    private List<AttendanceRecord> fetchAttendance(Integer departmentId, LocalDate startDate, LocalDate endDate) {
        List<AttendanceRecord> all = attendanceRepository.findAllFiltered(null, departmentId, null);
        return all.stream()
                .filter(a -> !a.getAttendanceMonth().isBefore(startDate) && !a.getAttendanceMonth().isAfter(endDate))
                .toList();
    }

    // ========== Helpers ==========

    private Integer resolveDepartmentId(String departmentKey) {
        if (departmentKey == null || departmentKey.isBlank() || "all".equalsIgnoreCase(departmentKey)) {
            return null;
        }
        return DEPT_KEY_MAP.entrySet().stream()
                .filter(e -> e.getValue().equalsIgnoreCase(departmentKey))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(null);
    }

    private static double round(double value, int decimals) {
        return BigDecimal.valueOf(value)
                .setScale(decimals, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private static int safeInt(Integer value) {
        return value != null ? value : 0;
    }
}
