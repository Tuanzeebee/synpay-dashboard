package com.companyx.synpay_dashboard.controller;

import java.time.LocalDate;
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

import com.companyx.synpay_dashboard.dto.request.AdjustAttendanceRequest;
import com.companyx.synpay_dashboard.dto.response.ApiResponse;
import com.companyx.synpay_dashboard.dto.response.AttendanceDetailResponse;
import com.companyx.synpay_dashboard.dto.response.AttendancePageResponse;
import com.companyx.synpay_dashboard.dto.response.AttendanceResponse;
import com.companyx.synpay_dashboard.security.GatewayPrincipal;
import com.companyx.synpay_dashboard.security.SecurityUtils;
import com.companyx.synpay_dashboard.service.AttendanceService;
import com.companyx.synpay_dashboard.service.AuditLogService;
import com.companyx.synpay_dashboard.service.RbacService;
import com.companyx.synpay_dashboard.utils.PermissionConstants;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Internal Attendance management endpoints.
 * <p>
 * RBAC:
 * <ul>
 *   <li>GET list/detail → {@code attendance.read}</li>
 *   <li>PATCH adjust   → {@code attendance.write}</li>
 *   <li>POST approve   → {@code attendance.approve}</li>
 *   <li>GET export     → {@code attendance.export}</li>
 * </ul>
 */
@RestController
@RequestMapping("/internal/attendance")
public class InternalAttendanceController {

    private static final Logger log = LoggerFactory.getLogger(InternalAttendanceController.class);

    private final AttendanceService attendanceService;
    private final RbacService rbacService;
    private final AuditLogService auditLogService;

    public InternalAttendanceController(AttendanceService attendanceService,
                                        RbacService rbacService,
                                        AuditLogService auditLogService) {
        this.attendanceService = attendanceService;
        this.rbacService = rbacService;
        this.auditLogService = auditLogService;
    }

    // ============================== LIST ==============================

    @GetMapping
    public ResponseEntity<ApiResponse<AttendancePageResponse>> listAttendance(
            @RequestParam(required = false) Integer employeeId,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate attendanceMonth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.ATTENDANCE_READ);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        AttendancePageResponse result = attendanceService.listAttendance(
                employeeId, departmentId, attendanceMonth, page, size,
                principal.getAccountId(), ip, ua);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ============================== GET BY ID ==============================

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AttendanceDetailResponse>> getAttendance(
            @PathVariable Integer id,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.ATTENDANCE_READ);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        AttendanceDetailResponse detail = attendanceService.getAttendance(
                id, principal.getAccountId(), ip, ua);

        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    // ============================== ADJUST ==============================

    @PatchMapping("/{id}/adjust")
    public ResponseEntity<ApiResponse<AttendanceResponse>> adjustAttendance(
            @PathVariable Integer id,
            @Valid @RequestBody AdjustAttendanceRequest request,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.ATTENDANCE_WRITE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            AttendanceResponse adjusted = attendanceService.adjustAttendance(
                    id, request, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(adjusted, "Attendance adjusted successfully"));
        } catch (Exception ex) {
            log.warn("ATTENDANCE_ADJUST failed for id={} by actor={}: {}",
                    id, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "ATTENDANCE_ADJUST", "attendance",
                    id.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ============================== APPROVE ==============================

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<AttendanceResponse>> approveAttendance(
            @PathVariable Integer id,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.ATTENDANCE_APPROVE);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        try {
            AttendanceResponse approved = attendanceService.approveAttendance(
                    id, principal.getAccountId(), ip, ua);
            return ResponseEntity.ok(ApiResponse.success(approved, "Attendance approved successfully"));
        } catch (Exception ex) {
            log.warn("ATTENDANCE_APPROVE failed for id={} by actor={}: {}",
                    id, principal.getAccountId(), ex.getMessage());
            auditLogService.log(principal.getAccountId(), "ATTENDANCE_APPROVE", "attendance",
                    id.toString(), null,
                    Map.of("result", "FAILURE", "reason", ex.getMessage()),
                    ip, ua);
            throw ex;
        }
    }

    // ============================== EXPORT ==============================

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAttendance(
            @RequestParam(required = false) Integer employeeId,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate attendanceMonth,
            HttpServletRequest httpRequest) {

        GatewayPrincipal principal = SecurityUtils.getCurrentPrincipal();
        rbacService.requirePermission(principal.getAccountId(), PermissionConstants.ATTENDANCE_EXPORT);

        String ip = resolveIpAddress(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");

        byte[] excelBytes = attendanceService.exportAttendance(
                employeeId, departmentId, attendanceMonth,
                principal.getAccountId(), ip, ua);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance_report.xlsx")
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
