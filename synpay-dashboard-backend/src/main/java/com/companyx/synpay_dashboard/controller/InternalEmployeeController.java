package com.companyx.synpay_dashboard.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.companyx.synpay_dashboard.dto.request.AssignAccountRequest;
import com.companyx.synpay_dashboard.dto.request.ChangeEmployeeStatusRequest;
import com.companyx.synpay_dashboard.dto.request.CreateEmployeeRequest;
import com.companyx.synpay_dashboard.dto.request.UpdateEmployeeRequest;
import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.EmployeePageResponse;
import com.companyx.synpay_dashboard.dto.response.EmployeeResponse;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.companyx.synpay_dashboard.service.AuditLogService;
import com.companyx.synpay_dashboard.service.EmployeeService;
import com.companyx.synpay_dashboard.service.RbacService;
import com.companyx.synpay_dashboard.utils.PermissionConstants;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/internal/employees")
public class InternalEmployeeController {

    private static final Logger log = LoggerFactory.getLogger(InternalEmployeeController.class);

    private final EmployeeService employeeService;
    private final RbacService rbacService;
    private final AuditLogService auditLogService;

    public InternalEmployeeController(EmployeeService employeeService,
                                      RbacService rbacService,
                                      AuditLogService auditLogService) {
        this.employeeService = employeeService;
        this.rbacService = rbacService;
        this.auditLogService = auditLogService;
    }

    // ── GET /internal/employees — paginated list with filters ────

    @GetMapping
    public ResponseEntity<ApiResponse<EmployeePageResponse>> listEmployees(
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) Integer positionId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.EMPLOYEE_READ);

        EmployeePageResponse result = employeeService.listEmployees(
                departmentId, positionId, status, keyword, page, size);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── GET /internal/employees/{id} — single detail ─────────────

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployee(@PathVariable Integer id) {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.EMPLOYEE_READ);

        EmployeeResponse employee = employeeService.getEmployee(id);
        return ResponseEntity.ok(ApiResponse.success(employee));
    }

    // ── POST /internal/employees — create ────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @Valid @RequestBody CreateEmployeeRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.EMPLOYEE_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            EmployeeResponse created = employeeService.createEmployee(
                    request, principal.getAccountId(), ip, ua);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "Employee created successfully"));
        } catch (Exception ex) {
            log.warn("EMPLOYEE_CREATE failed by actor={}: {}", principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "EMPLOYEE_CREATE", "employee",
                    null, null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ── PUT /internal/employees/{id} — update profile ────────────

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateEmployeeRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.EMPLOYEE_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            EmployeeResponse updated = employeeService.updateEmployee(
                    id, request, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(updated, "Employee updated successfully"));
        } catch (Exception ex) {
            log.warn("EMPLOYEE_UPDATE failed for id={} by actor={}: {}",
                    id, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "EMPLOYEE_UPDATE", "employee",
                    id.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ── PATCH /internal/employees/{id}/status — change status ────

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<EmployeeResponse>> changeStatus(
            @PathVariable Integer id,
            @Valid @RequestBody ChangeEmployeeStatusRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.EMPLOYEE_DISABLE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            EmployeeResponse updated = employeeService.changeStatus(
                    id, request, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(updated, "Employee status changed successfully"));
        } catch (Exception ex) {
            log.warn("EMPLOYEE_STATUS_CHANGE failed for id={} by actor={}: {}",
                    id, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "EMPLOYEE_STATUS_CHANGE", "employee",
                    id.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage(),
                           "requestedStatus", request.getStatus() != null ? request.getStatus() : ""),
                    ip, ua);
            throw ex;
        }
    }

    // ── POST /internal/employees/{id}/assign-account — link ──────

    @PostMapping("/{id}/assign-account")
    public ResponseEntity<ApiResponse<EmployeeResponse>> assignAccount(
            @PathVariable Integer id,
            @Valid @RequestBody AssignAccountRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.EMPLOYEE_ASSIGN_ACCOUNT);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            EmployeeResponse result = employeeService.assignAccount(
                    id, request, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(result, "Account linked to employee successfully"));
        } catch (Exception ex) {
            log.warn("EMPLOYEE_ASSIGN_ACCOUNT failed for employeeId={} by actor={}: {}",
                    id, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "EMPLOYEE_ASSIGN_ACCOUNT", "employee",
                    id.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage(),
                           "accountId", request.getAccountId() != null ? request.getAccountId() : ""),
                    ip, ua);
            throw ex;
        }
    }

    // ── Helper ───────────────────────────────────────────────────

    private String resolveIpAddress(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
