package com.companyx.synpay_dashboard.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.dto.request.AdjustAttendanceRequest;
import com.companyx.synpay_dashboard.dto.response.AttendanceDetailResponse;
import com.companyx.synpay_dashboard.dto.response.AttendancePageResponse;
import com.companyx.synpay_dashboard.dto.response.AttendanceResponse;
import com.companyx.synpay_dashboard.entity.payroll.AttendanceRecord;
import com.companyx.synpay_dashboard.entity.payroll.DepartmentPayroll;
import com.companyx.synpay_dashboard.entity.payroll.EmployeePayroll;
import com.companyx.synpay_dashboard.entity.payroll.PositionPayroll;
import com.companyx.synpay_dashboard.exceptions.BusinessException;
import com.companyx.synpay_dashboard.exceptions.ResourceNotFoundException;
import com.companyx.synpay_dashboard.repository.payroll.AttendanceRepository;

/**
 * Service for querying and adjusting attendance records.
 *
 * <ul>
 *   <li>Attendance records are immutable by default.</li>
 *   <li>Adjustments are allowed only with {@code ATTENDANCE_WRITE} permission.</li>
 *   <li>Cannot delete attendance records.</li>
 *   <li>Adjustments affect payroll downstream.</li>
 *   <li>All access and changes are audit-logged.</li>
 * </ul>
 */
@Service
public class AttendanceService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceService.class);

    private final AttendanceRepository attendanceRepository;
    private final AuditLogService auditLogService;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             AuditLogService auditLogService) {
        this.attendanceRepository = attendanceRepository;
        this.auditLogService = auditLogService;
    }

    // ========================================================================
    //  LIST — paginated & filtered
    // ========================================================================

    @Transactional(transactionManager = "payrollTransactionManager", readOnly = true)
    public AttendancePageResponse listAttendance(Integer employeeId,
                                                 Integer departmentId,
                                                 LocalDate attendanceMonth,
                                                 int page, int size,
                                                 Integer actorId, String ip, String ua) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "attendanceMonth"));
        Page<AttendanceRecord> result = attendanceRepository.findFiltered(
                employeeId, departmentId, attendanceMonth, pageable);

        List<AttendanceResponse> items = result.getContent().stream()
                .map(this::toAttendanceResponse)
                .collect(Collectors.toList());

        auditLogService.log(actorId, "ATTENDANCE_LIST", "attendance",
                null, null, buildFilterInfo(employeeId, departmentId, attendanceMonth), ip, ua);

        return new AttendancePageResponse(items, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    // ========================================================================
    //  GET BY ID — detailed view
    // ========================================================================

    @Transactional(transactionManager = "payrollTransactionManager", readOnly = true)
    public AttendanceDetailResponse getAttendance(Integer attendanceId,
                                                  Integer actorId, String ip, String ua) {

        AttendanceRecord record = attendanceRepository.findByIdWithDetails(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found: " + attendanceId));

        AttendanceDetailResponse detail = toAttendanceDetailResponse(record);

        auditLogService.log(actorId, "ATTENDANCE_VIEW", "attendance",
                attendanceId.toString(), null, null, ip, ua);

        return detail;
    }

    // ========================================================================
    //  ADJUST — work_days / absent_days / leave_days
    // ========================================================================

    @Transactional(transactionManager = "payrollTransactionManager")
    public AttendanceResponse adjustAttendance(Integer attendanceId,
                                               AdjustAttendanceRequest request,
                                               Integer actorId, String ip, String ua) {

        AttendanceRecord record = attendanceRepository.findByIdWithDetails(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found: " + attendanceId));

        if (request.getWorkDays() == null && request.getAbsentDays() == null
                && request.getLeaveDays() == null) {
            throw new BusinessException("At least one field must be provided for adjustment");
        }

        // Capture old values for audit
        Map<String, Object> oldValues = Map.of(
                "workDays", record.getWorkDays(),
                "absentDays", record.getAbsentDays(),
                "leaveDays", record.getLeaveDays()
        );

        // Apply adjustments
        if (request.getWorkDays() != null) {
            record.setWorkDays(request.getWorkDays());
        }
        if (request.getAbsentDays() != null) {
            record.setAbsentDays(request.getAbsentDays());
        }
        if (request.getLeaveDays() != null) {
            record.setLeaveDays(request.getLeaveDays());
        }

        // Validate consistency: work_days + absent_days + leave_days should not exceed 31
        int total = record.getWorkDays() + record.getAbsentDays() + record.getLeaveDays();
        if (total > 31) {
            throw new BusinessException(
                    "Total days (workDays + absentDays + leaveDays = " + total + ") cannot exceed 31");
        }

        attendanceRepository.save(record);

        Map<String, Object> newValues = new LinkedHashMap<>();
        newValues.put("workDays", record.getWorkDays());
        newValues.put("absentDays", record.getAbsentDays());
        newValues.put("leaveDays", record.getLeaveDays());
        if (request.getReason() != null) {
            newValues.put("reason", request.getReason());
        }

        auditLogService.log(actorId, "ATTENDANCE_ADJUST", "attendance",
                attendanceId.toString(), oldValues, newValues, ip, ua);

        log.info("Attendance {} adjusted by actor {}: workDays={}, absentDays={}, leaveDays={}",
                attendanceId, actorId, record.getWorkDays(), record.getAbsentDays(), record.getLeaveDays());

        return toAttendanceResponse(record);
    }

    // ========================================================================
    //  APPROVE — logical approval via audit trail (no schema change)
    // ========================================================================

    @Transactional(transactionManager = "payrollTransactionManager", readOnly = true)
    public AttendanceResponse approveAttendance(Integer attendanceId,
                                                Integer actorId, String ip, String ua) {

        AttendanceRecord record = attendanceRepository.findByIdWithDetails(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found: " + attendanceId));

        Map<String, Object> approvalInfo = Map.of(
                "attendanceId", record.getAttendanceId(),
                "employeeId", record.getEmployeeId(),
                "attendanceMonth", record.getAttendanceMonth().toString(),
                "workDays", record.getWorkDays(),
                "absentDays", record.getAbsentDays(),
                "leaveDays", record.getLeaveDays()
        );

        auditLogService.log(actorId, "ATTENDANCE_APPROVE", "attendance",
                attendanceId.toString(), null, approvalInfo, ip, ua);

        log.info("Attendance {} approved by actor {}", attendanceId, actorId);

        return toAttendanceResponse(record);
    }

    // ========================================================================
    //  EXPORT — Excel report (.xlsx)
    // ========================================================================

    @Transactional(transactionManager = "payrollTransactionManager", readOnly = true)
    public byte[] exportAttendance(Integer employeeId,
                                   Integer departmentId,
                                   LocalDate attendanceMonth,
                                   Integer actorId, String ip, String ua) {

        List<AttendanceRecord> records = attendanceRepository.findAllFiltered(
                employeeId, departmentId, attendanceMonth);

        try (Workbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet("Chấm Công");

            // ── Header style ─────────────────────────────────
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = wb.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            CellStyle textStyle = wb.createCellStyle();
            textStyle.setBorderBottom(BorderStyle.THIN);
            textStyle.setBorderTop(BorderStyle.THIN);
            textStyle.setBorderLeft(BorderStyle.THIN);
            textStyle.setBorderRight(BorderStyle.THIN);

            CellStyle centerStyle = wb.createCellStyle();
            centerStyle.setAlignment(HorizontalAlignment.CENTER);
            centerStyle.setBorderBottom(BorderStyle.THIN);
            centerStyle.setBorderTop(BorderStyle.THIN);
            centerStyle.setBorderLeft(BorderStyle.THIN);
            centerStyle.setBorderRight(BorderStyle.THIN);

            // ── Header row ───────────────────────────────────
            String[] headers = {
                "Mã chấm công", "Mã NV", "Họ tên", "Phòng ban", "Chức vụ",
                "Tháng", "Ngày công", "Ngày vắng", "Ngày phép", "Ngày tạo"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                var cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // ── Data rows ────────────────────────────────────
            int rowIdx = 1;
            for (AttendanceRecord a : records) {
                Row row = sheet.createRow(rowIdx++);
                EmployeePayroll emp = a.getEmployee();

                var c0 = row.createCell(0); c0.setCellValue(a.getAttendanceId()); c0.setCellStyle(centerStyle);
                var c1 = row.createCell(1); c1.setCellValue(a.getEmployeeId()); c1.setCellStyle(centerStyle);

                var c2 = row.createCell(2);
                c2.setCellValue(emp != null ? emp.getFullName() : "");
                c2.setCellStyle(textStyle);

                var c3 = row.createCell(3);
                c3.setCellValue(emp != null && emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : "");
                c3.setCellStyle(textStyle);

                var c4 = row.createCell(4);
                c4.setCellValue(emp != null && emp.getPosition() != null ? emp.getPosition().getPositionName() : "");
                c4.setCellStyle(textStyle);

                var c5 = row.createCell(5);
                c5.setCellValue(a.getAttendanceMonth() != null ? a.getAttendanceMonth().toString() : "");
                c5.setCellStyle(centerStyle);

                var c6 = row.createCell(6); c6.setCellValue(a.getWorkDays()); c6.setCellStyle(centerStyle);
                var c7 = row.createCell(7); c7.setCellValue(a.getAbsentDays()); c7.setCellStyle(centerStyle);
                var c8 = row.createCell(8); c8.setCellValue(a.getLeaveDays()); c8.setCellStyle(centerStyle);

                var c9 = row.createCell(9);
                c9.setCellValue(a.getCreatedAt() != null ? a.getCreatedAt().toString() : "");
                c9.setCellStyle(centerStyle);
            }

            // ── Auto-size columns ────────────────────────────
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 512);
            }

            wb.write(out);
            auditLogService.log(actorId, "ATTENDANCE_EXPORT", "attendance",
                    null, null, buildFilterInfo(employeeId, departmentId, attendanceMonth), ip, ua);

            log.info("Attendance export (Excel) by actor {} — {} records", actorId, records.size());

            return out.toByteArray();

        } catch (IOException e) {
            throw new BusinessException("Failed to generate Excel report: " + e.getMessage());
        }
    }

    // ========================================================================
    //  Mapping helpers
    // ========================================================================

    private AttendanceResponse toAttendanceResponse(AttendanceRecord a) {
        AttendanceResponse r = new AttendanceResponse();
        r.setAttendanceId(a.getAttendanceId());
        r.setEmployeeId(a.getEmployeeId());
        r.setWorkDays(a.getWorkDays());
        r.setAbsentDays(a.getAbsentDays());
        r.setLeaveDays(a.getLeaveDays());
        r.setAttendanceMonth(a.getAttendanceMonth());
        r.setCreatedAt(a.getCreatedAt());

        EmployeePayroll emp = a.getEmployee();
        if (emp != null) {
            r.setEmployeeName(emp.getFullName());
            if (emp.getDepartment() != null) {
                r.setDepartmentName(emp.getDepartment().getDepartmentName());
            }
            if (emp.getPosition() != null) {
                r.setPositionName(emp.getPosition().getPositionName());
            }
        }
        return r;
    }

    private AttendanceDetailResponse toAttendanceDetailResponse(AttendanceRecord a) {
        AttendanceDetailResponse r = new AttendanceDetailResponse();
        r.setAttendanceId(a.getAttendanceId());
        r.setEmployeeId(a.getEmployeeId());
        r.setWorkDays(a.getWorkDays());
        r.setAbsentDays(a.getAbsentDays());
        r.setLeaveDays(a.getLeaveDays());
        r.setAttendanceMonth(a.getAttendanceMonth());
        r.setCreatedAt(a.getCreatedAt());

        EmployeePayroll emp = a.getEmployee();
        if (emp != null) {
            r.setEmployeeName(emp.getFullName());
            r.setEmployeeStatus(emp.getStatus());

            DepartmentPayroll dept = emp.getDepartment();
            if (dept != null) {
                r.setDepartmentId(dept.getDepartmentId());
                r.setDepartmentName(dept.getDepartmentName());
            }
            PositionPayroll pos = emp.getPosition();
            if (pos != null) {
                r.setPositionId(pos.getPositionId());
                r.setPositionName(pos.getPositionName());
            }
        }
        return r;
    }

    private Map<String, Object> buildFilterInfo(Integer employeeId,
                                                Integer departmentId,
                                                LocalDate attendanceMonth) {
        Map<String, Object> filters = new LinkedHashMap<>();
        if (employeeId != null) filters.put("employeeId", employeeId);
        if (departmentId != null) filters.put("departmentId", departmentId);
        if (attendanceMonth != null) filters.put("attendanceMonth", attendanceMonth.toString());
        return filters.isEmpty() ? null : filters;
    }
}
