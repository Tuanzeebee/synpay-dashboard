package com.companyx.synpay_dashboard.controller;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.AttendanceReportResponse;
import com.companyx.synpay_dashboard.dto.response.DashboardReportResponse;
import com.companyx.synpay_dashboard.dto.response.HrReportResponse;
import com.companyx.synpay_dashboard.dto.response.PayrollReportResponse;
import com.companyx.synpay_dashboard.dto.response.ReportsDataResponse;
import com.companyx.synpay_dashboard.dto.response.ReportsDataResponse.DividendTrendResponse;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.companyx.synpay_dashboard.service.RbacService;
import com.companyx.synpay_dashboard.service.ReportService;
import com.companyx.synpay_dashboard.utils.PermissionConstants;

/**
 * Internal Reports &amp; Analytics endpoints.
 * <p>
 * RBAC:
 * <ul>
 *   <li>GET /internal/reports → {@code report.view_dashboard}</li>
 * </ul>
 * <p>
 * All endpoints are <strong>read-only</strong> and never modify data.
 */
@RestController
@RequestMapping("/internal/reports")
public class InternalReportController {

    private static final Logger log = LoggerFactory.getLogger(InternalReportController.class);

    private final ReportService reportService;
    private final RbacService rbacService;

    public InternalReportController(ReportService reportService,
                                    RbacService rbacService) {
        this.reportService = reportService;
        this.rbacService = rbacService;
    }

    /**
     * GET /internal/reports
     * <p>
     * Returns aggregated reports data including KPIs, department stats,
     * salary trends, attendance rates, dividends, and performance.
     *
     * @param department optional department filter key (e.g. "tech", "hr", "all")
     * @param startDate  period start (yyyy-MM-dd), defaults to start of current year
     * @param endDate    period end (yyyy-MM-dd), defaults to today
     */
    @GetMapping
    public ResponseEntity<ApiResponse<ReportsDataResponse>> getReportsData(
            @RequestParam(required = false, defaultValue = "all") String department,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.REPORT_VIEW_DASHBOARD);

        // Default date range: current year
        if (startDate == null) {
            startDate = LocalDate.now().withMonth(1).withDayOfMonth(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        log.info("Reports request by account={}: department={}, {} to {}",
                principal.getAccountId(), department, startDate, endDate);

        ReportsDataResponse data = reportService.getReportsData(department, startDate, endDate);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /internal/reports/dashboard — high-level KPIs overview.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardReportResponse>> getDashboardReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.REPORT_VIEW_DASHBOARD);

        LocalDate[] range = defaultRange(startDate, endDate);
        DashboardReportResponse data = reportService.getDashboardReport(range[0], range[1]);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /internal/reports/hr — employee and department metrics.
     */
    @GetMapping("/hr")
    public ResponseEntity<ApiResponse<HrReportResponse>> getHrReport(
            @RequestParam(required = false, defaultValue = "all") String department,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.REPORT_VIEW_HR);

        LocalDate[] range = defaultRange(startDate, endDate);
        HrReportResponse data = reportService.getHrReport(department, range[0], range[1]);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /internal/reports/payroll — salary totals, trends, dividends.
     */
    @GetMapping("/payroll")
    public ResponseEntity<ApiResponse<PayrollReportResponse>> getPayrollReport(
            @RequestParam(required = false, defaultValue = "all") String department,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.REPORT_VIEW_PAYROLL);

        LocalDate[] range = defaultRange(startDate, endDate);
        PayrollReportResponse data = reportService.getPayrollReport(department, range[0], range[1]);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /internal/reports/attendance — attendance rates, leave breakdown.
     */
    @GetMapping("/attendance")
    public ResponseEntity<ApiResponse<AttendanceReportResponse>> getAttendanceReport(
            @RequestParam(required = false, defaultValue = "all") String department,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.REPORT_VIEW_DASHBOARD);

        LocalDate[] range = defaultRange(startDate, endDate);
        AttendanceReportResponse data = reportService.getAttendanceReport(department, range[0], range[1]);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /internal/reports/dividends — dividend trend by quarter.
     */
    @GetMapping("/dividends")
    public ResponseEntity<ApiResponse<List<DividendTrendResponse>>> getDividendsReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.REPORT_VIEW_PAYROLL);

        LocalDate[] range = defaultRange(startDate, endDate);
        List<DividendTrendResponse> data = reportService.getDividendsReport(range[0], range[1]);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /internal/reports/export — full data for export purposes.
     * Uses the same aggregated response as the main endpoint but requires export permission.
     */
    @GetMapping("/export")
    public ResponseEntity<ApiResponse<ReportsDataResponse>> exportReport(
            @RequestParam(required = false, defaultValue = "all") String department,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.REPORT_EXPORT);

        LocalDate[] range = defaultRange(startDate, endDate);
        ReportsDataResponse data = reportService.getReportsData(department, range[0], range[1]);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    // ========== Helpers ==========

    private LocalDate[] defaultRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now().withMonth(1).withDayOfMonth(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        return new LocalDate[]{startDate, endDate};
    }
}
