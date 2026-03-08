package com.companyx.synpay_dashboard.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.DashboardActivityResponse;
import com.companyx.synpay_dashboard.dto.response.DashboardAttendanceResponse;
import com.companyx.synpay_dashboard.dto.response.DashboardHrResponse;
import com.companyx.synpay_dashboard.dto.response.DashboardOverviewResponse;
import com.companyx.synpay_dashboard.dto.response.DashboardPayrollResponse;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.companyx.synpay_dashboard.service.DashboardService;
import com.companyx.synpay_dashboard.service.RbacService;
import com.companyx.synpay_dashboard.utils.PermissionConstants;

/**
 * Internal Dashboard endpoints — read-only system overview APIs.
 * <p>
 * RBAC permissions:
 * <ul>
 *   <li>{@code /overview}       → {@code report.view_dashboard}</li>
 *   <li>{@code /hr}             → {@code report.view_hr}</li>
 *   <li>{@code /payroll}        → {@code report.view_payroll}</li>
 *   <li>{@code /attendance}     → {@code report.view_dashboard}</li>
 *   <li>{@code /activity}       → {@code report.view_dashboard}</li>
 * </ul>
 * <p>
 * All endpoints are <strong>read-only</strong> and never modify data.
 */
@RestController
@RequestMapping("/internal/dashboard")
public class InternalDashboardController {

    private static final Logger log = LoggerFactory.getLogger(InternalDashboardController.class);

    private final DashboardService dashboardService;
    private final RbacService rbacService;

    public InternalDashboardController(DashboardService dashboardService,
                                       RbacService rbacService) {
        this.dashboardService = dashboardService;
        this.rbacService = rbacService;
    }

    /**
     * GET /internal/dashboard/overview
     * <p>
     * Returns the complete dashboard overview: KPI cards, chart datasets
     * (department distribution, headcount trend, payroll trend, payroll by
     * department), and recent alerts.
     */
    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<DashboardOverviewResponse>> getOverview() {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.REPORT_VIEW_DASHBOARD);

        log.info("Dashboard overview requested by account={}", principal.getAccountId());
        DashboardOverviewResponse data = dashboardService.getOverview();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /internal/dashboard/hr
     * <p>
     * Returns HR-specific dashboard data: employee counts, department
     * distribution bar chart, and headcount trend area chart.
     */
    @GetMapping("/hr")
    public ResponseEntity<ApiResponse<DashboardHrResponse>> getHrDashboard() {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.REPORT_VIEW_HR);

        log.info("Dashboard HR requested by account={}", principal.getAccountId());
        DashboardHrResponse data = dashboardService.getHrDashboard();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /internal/dashboard/payroll
     * <p>
     * Returns payroll-specific dashboard data: monthly payroll trend area
     * chart and salary distribution donut chart.
     */
    @GetMapping("/payroll")
    public ResponseEntity<ApiResponse<DashboardPayrollResponse>> getPayrollDashboard() {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.REPORT_VIEW_PAYROLL);

        log.info("Dashboard payroll requested by account={}", principal.getAccountId());
        DashboardPayrollResponse data = dashboardService.getPayrollDashboard();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /internal/dashboard/attendance
     * <p>
     * Returns attendance overview: attendance rate, total leave/absent
     * days, and month-over-month changes.
     */
    @GetMapping("/attendance")
    public ResponseEntity<ApiResponse<DashboardAttendanceResponse>> getAttendanceDashboard() {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.REPORT_VIEW_DASHBOARD);

        log.info("Dashboard attendance requested by account={}", principal.getAccountId());
        DashboardAttendanceResponse data = dashboardService.getAttendanceDashboard();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * GET /internal/dashboard/activity
     * <p>
     * Returns recent security activity from audit logs:
     * login events, role changes, and other system actions.
     */
    @GetMapping("/activity")
    public ResponseEntity<ApiResponse<DashboardActivityResponse>> getActivityDashboard() {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.REPORT_VIEW_DASHBOARD);

        log.info("Dashboard activity requested by account={}", principal.getAccountId());
        DashboardActivityResponse data = dashboardService.getActivityDashboard();
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
