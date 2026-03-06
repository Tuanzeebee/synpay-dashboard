package com.companyx.synpay_dashboard.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.companyx.synpay_dashboard.dto.request.AdjustSalaryRequest;
import com.companyx.synpay_dashboard.dto.request.CreateSalaryRequest;
import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.SalaryDetailResponse;
import com.companyx.synpay_dashboard.dto.response.SalaryPageResponse;
import com.companyx.synpay_dashboard.dto.response.SalaryResponse;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.companyx.synpay_dashboard.service.AuditLogService;
import com.companyx.synpay_dashboard.service.PayrollService;
import com.companyx.synpay_dashboard.service.RbacService;
import com.companyx.synpay_dashboard.utils.PermissionConstants;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Internal Payroll management endpoints.
 * <p>
 * RBAC:
 * <ul>
 *   <li>GET endpoints → {@code payroll.read}</li>
 *   <li>PATCH adjust → {@code payroll.write}</li>
 *   <li>POST approve → {@code payroll.approve}</li>
 *   <li>GET export → {@code payroll.export}</li>
 * </ul>
 */
@RestController
@RequestMapping("/internal/payroll")
public class InternalPayrollController {

    private static final Logger log = LoggerFactory.getLogger(InternalPayrollController.class);

    private final PayrollService payrollService;
    private final RbacService rbacService;
    private final AuditLogService auditLogService;

    public InternalPayrollController(PayrollService payrollService,
                                     RbacService rbacService,
                                     AuditLogService auditLogService) {
        this.payrollService = payrollService;
        this.rbacService = rbacService;
        this.auditLogService = auditLogService;
    }

    // ============================== SALARY MONTHS ==============================

    @GetMapping("/months")
    public ResponseEntity<ApiResponse<List<String>>> getSalaryMonths(HttpServletRequest httpRequest) {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.PAYROLL_READ);

        List<String> months = payrollService.getSalaryMonths().stream()
                .map(LocalDate::toString)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(months));
    }

    // ============================== LIST ==============================

    @GetMapping
    public ResponseEntity<ApiResponse<SalaryPageResponse>> listSalaries(
            @RequestParam(required = false) Integer employeeId,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate salaryMonth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.PAYROLL_READ);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        SalaryPageResponse result = payrollService.listSalaries(
                employeeId, departmentId, salaryMonth, page, size,
                principal.getAccountId(), ip, ua);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ============================== GET BY ID ==============================

    @GetMapping("/{salaryId}")
    public ResponseEntity<ApiResponse<SalaryDetailResponse>> getSalary(
            @PathVariable Integer salaryId,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.PAYROLL_READ);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        SalaryDetailResponse detail = payrollService.getSalary(
                salaryId, principal.getAccountId(), ip, ua);

        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    // ============================== CREATE ==============================

    @PostMapping
    public ResponseEntity<ApiResponse<SalaryResponse>> createSalary(
            @Valid @RequestBody CreateSalaryRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.PAYROLL_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            SalaryResponse created = payrollService.createSalary(
                    request, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(created, "Salary created successfully"));
        } catch (Exception ex) {
            log.warn("SALARY_CREATE failed by actor={}: {}",
                    principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "SALARY_CREATE", "salary",
                    null, null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ============================== ADJUST ==============================

    @PatchMapping("/{salaryId}/adjust")
    public ResponseEntity<ApiResponse<SalaryResponse>> adjustSalary(
            @PathVariable Integer salaryId,
            @Valid @RequestBody AdjustSalaryRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.PAYROLL_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            SalaryResponse adjusted = payrollService.adjustSalary(
                    salaryId, request, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(adjusted, "Salary adjusted successfully"));
        } catch (Exception ex) {
            log.warn("SALARY_ADJUST failed for id={} by actor={}: {}",
                    salaryId, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "SALARY_ADJUST", "salary",
                    salaryId.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ============================== APPROVE ==============================

    @PostMapping("/{salaryId}/approve")
    public ResponseEntity<ApiResponse<SalaryResponse>> approveSalary(
            @PathVariable Integer salaryId,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.PAYROLL_APPROVE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            SalaryResponse approved = payrollService.approveSalary(
                    salaryId, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(approved, "Salary approved successfully"));
        } catch (Exception ex) {
            log.warn("SALARY_APPROVE failed for id={} by actor={}: {}",
                    salaryId, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "SALARY_APPROVE", "salary",
                    salaryId.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ============================== EXPORT ==============================

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportSalaries(
            @RequestParam(required = false) Integer employeeId,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate salaryMonth,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.PAYROLL_EXPORT);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        byte[] excelBytes = payrollService.exportSalaries(
                employeeId, departmentId, salaryMonth,
                principal.getAccountId(), ip, ua);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=salary_report.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    // ============================== HELPER ==============================

    private String resolveIpAddress(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
