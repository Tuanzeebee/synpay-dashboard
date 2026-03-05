package com.companyx.synpay_dashboard.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.companyx.synpay_dashboard.dto.request.CreateDepartmentRequest;
import com.companyx.synpay_dashboard.dto.request.UpdateDepartmentRequest;
import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.DepartmentPageResponse;
import com.companyx.synpay_dashboard.dto.response.DepartmentResponse;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.companyx.synpay_dashboard.service.AuditLogService;
import com.companyx.synpay_dashboard.service.DepartmentService;
import com.companyx.synpay_dashboard.service.RbacService;
import com.companyx.synpay_dashboard.utils.PermissionConstants;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Internal Department management endpoints.
 * <p>
 * RBAC:
 * <ul>
 *   <li>GET  endpoints → {@code department.read}</li>
 *   <li>POST / PUT endpoints → {@code department.write}</li>
 * </ul>
 */
@RestController
@RequestMapping("/internal/departments")
public class InternalDepartmentController {

    private static final Logger log = LoggerFactory.getLogger(InternalDepartmentController.class);

    private final DepartmentService departmentService;
    private final RbacService rbacService;
    private final AuditLogService auditLogService;

    public InternalDepartmentController(DepartmentService departmentService,
                                        RbacService rbacService,
                                        AuditLogService auditLogService) {
        this.departmentService = departmentService;
        this.rbacService = rbacService;
        this.auditLogService = auditLogService;
    }

    // ============================== LIST ==============================

    @GetMapping
    public ResponseEntity<ApiResponse<DepartmentPageResponse>> listDepartments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.DEPARTMENT_READ);

        DepartmentPageResponse result = departmentService.listDepartments(page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ============================== GET BY ID ==============================

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getDepartment(@PathVariable Integer id) {
        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.DEPARTMENT_READ);

        DepartmentResponse department = departmentService.getDepartment(id);
        return ResponseEntity.ok(ApiResponse.success(department));
    }

    // ============================== CREATE ==============================

    @PostMapping
    public ResponseEntity<ApiResponse<DepartmentResponse>> createDepartment(
            @Valid @RequestBody CreateDepartmentRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.DEPARTMENT_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            DepartmentResponse created = departmentService.createDepartment(
                    request, principal.getAccountId(), ip, ua);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "Department created successfully"));
        } catch (Exception ex) {
            log.warn("DEPARTMENT_CREATE failed by actor={}: {}", principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "DEPARTMENT_CREATE", "department",
                    null, null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ============================== UPDATE ==============================

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentResponse>> updateDepartment(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateDepartmentRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.DEPARTMENT_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            DepartmentResponse updated = departmentService.updateDepartment(
                    id, request, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(updated, "Department updated successfully"));
        } catch (Exception ex) {
            log.warn("DEPARTMENT_UPDATE failed for id={} by actor={}: {}",
                    id, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "DEPARTMENT_UPDATE", "department",
                    id.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ============================== DELETE ==============================

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(
            @PathVariable Integer id,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.DEPARTMENT_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            departmentService.deleteDepartment(id, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(null, "Department deleted successfully"));
        } catch (Exception ex) {
            log.warn("DEPARTMENT_DELETE failed for id={} by actor={}: {}",
                    id, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "DEPARTMENT_DELETE", "department",
                    id.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
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
