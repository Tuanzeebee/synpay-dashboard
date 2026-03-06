package com.companyx.synpay_dashboard.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
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

import com.companyx.synpay_dashboard.dto.request.AdjustSalaryRequest;
import com.companyx.synpay_dashboard.dto.request.CreateSalaryRequest;
import com.companyx.synpay_dashboard.dto.response.SalaryDetailResponse;
import com.companyx.synpay_dashboard.dto.response.SalaryPageResponse;
import com.companyx.synpay_dashboard.dto.response.SalaryResponse;
import com.companyx.synpay_dashboard.entity.payroll.AttendanceRecord;
import com.companyx.synpay_dashboard.entity.payroll.DepartmentPayroll;
import com.companyx.synpay_dashboard.entity.payroll.EmployeePayroll;
import com.companyx.synpay_dashboard.entity.payroll.PositionPayroll;
import com.companyx.synpay_dashboard.entity.payroll.Salary;
import com.companyx.synpay_dashboard.exceptions.BusinessException;
import com.companyx.synpay_dashboard.exceptions.ResourceNotFoundException;
import com.companyx.synpay_dashboard.repository.payroll.AttendanceRepository;
import com.companyx.synpay_dashboard.repository.payroll.SalaryRepository;

/**
 * Service for querying and adjusting payroll salary records.
 *
 * <ul>
 *   <li>Salary records are immutable by default.</li>
 *   <li>Only bonus and deductions may be adjusted; base salary cannot be modified.</li>
 *   <li>Net salary is recalculated as: baseSalary + bonus − deductions.</li>
 *   <li>All mutations and views are audit-logged.</li>
 * </ul>
 */
@Service
public class PayrollService {

    private static final Logger log = LoggerFactory.getLogger(PayrollService.class);

    private final SalaryRepository salaryRepository;
    private final AttendanceRepository attendanceRepository;
    private final AuditLogService auditLogService;

    public PayrollService(SalaryRepository salaryRepository,
                          AttendanceRepository attendanceRepository,
                          AuditLogService auditLogService) {
        this.salaryRepository = salaryRepository;
        this.attendanceRepository = attendanceRepository;
        this.auditLogService = auditLogService;
    }

    // ========================================================================
    //  SALARY MONTHS — distinct values for filter dropdown
    // ========================================================================

    @Transactional(transactionManager = "payrollTransactionManager", readOnly = true)
    public List<LocalDate> getSalaryMonths() {
        return salaryRepository.findDistinctSalaryMonths();
    }

    // ========================================================================
    //  LIST — paginated & filtered
    // ========================================================================

    @Transactional(transactionManager = "payrollTransactionManager", readOnly = true)
    public SalaryPageResponse listSalaries(Integer employeeId,
                                           Integer departmentId,
                                           LocalDate salaryMonth,
                                           int page, int size,
                                           Integer actorId, String ip, String ua) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "salaryMonth"));
        Page<Salary> result = salaryRepository.findFiltered(employeeId, departmentId, salaryMonth, pageable);

        List<SalaryResponse> items = result.getContent().stream()
                .map(this::toSalaryResponse)
                .collect(Collectors.toList());

        auditLogService.log(actorId, "SALARY_LIST", "salary",
                null, null, buildFilterInfo(employeeId, departmentId, salaryMonth), ip, ua);

        return new SalaryPageResponse(items, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    // ========================================================================
    //  GET BY ID — detailed view
    // ========================================================================

    @Transactional(transactionManager = "payrollTransactionManager", readOnly = true)
    public SalaryDetailResponse getSalary(Integer salaryId,
                                          Integer actorId, String ip, String ua) {

        Salary salary = salaryRepository.findByIdWithDetails(salaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Salary record not found: " + salaryId));

        SalaryDetailResponse detail = toSalaryDetailResponse(salary);

        auditLogService.log(actorId, "SALARY_VIEW", "salary",
                salaryId.toString(), null, null, ip, ua);

        return detail;
    }

    // ========================================================================
    //  CREATE — new salary record
    // ========================================================================

    @Transactional(transactionManager = "payrollTransactionManager")
    public SalaryResponse createSalary(CreateSalaryRequest request,
                                       Integer actorId, String ip, String ua) {

        LocalDate month = LocalDate.parse(request.getSalaryMonth());

        Salary salary = new Salary();
        salary.setEmployeeId(request.getEmployeeId());
        salary.setSalaryMonth(month);
        salary.setBaseSalary(request.getBaseSalary());
        salary.setBonus(request.getBonus() != null ? request.getBonus() : BigDecimal.ZERO);
        salary.setDeductions(request.getDeductions() != null ? request.getDeductions() : BigDecimal.ZERO);

        if (request.getNetSalary() != null) {
            salary.setNetSalary(request.getNetSalary());
        } else {
            BigDecimal netSalary = salary.getBaseSalary()
                    .add(salary.getBonus())
                    .subtract(salary.getDeductions());
            salary.setNetSalary(netSalary);
        }

        salaryRepository.save(salary);

        // Re-fetch with joins to populate employee/department/position names
        Salary saved = salaryRepository.findByIdWithDetails(salary.getSalaryId())
                .orElse(salary);

        Map<String, Object> newValues = Map.of(
                "employeeId", saved.getEmployeeId(),
                "salaryMonth", saved.getSalaryMonth().toString(),
                "baseSalary", saved.getBaseSalary(),
                "bonus", saved.getBonus(),
                "deductions", saved.getDeductions(),
                "netSalary", saved.getNetSalary()
        );

        auditLogService.log(actorId, "SALARY_CREATE", "salary",
                saved.getSalaryId().toString(), null, newValues, ip, ua);

        log.info("Salary {} created by actor {} for employee {} month {}",
                saved.getSalaryId(), actorId, saved.getEmployeeId(), saved.getSalaryMonth());

        return toSalaryResponse(saved);
    }

    // ========================================================================
    //  ADJUST — baseSalary, bonus, deductions, netSalary
    // ========================================================================

    @Transactional(transactionManager = "payrollTransactionManager")
    public SalaryResponse adjustSalary(Integer salaryId,
                                       AdjustSalaryRequest request,
                                       Integer actorId, String ip, String ua) {

        Salary salary = salaryRepository.findByIdWithDetails(salaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Salary record not found: " + salaryId));

        if (request.getBaseSalary() == null && request.getBonus() == null
                && request.getDeductions() == null && request.getNetSalary() == null) {
            throw new BusinessException("At least one field must be provided");
        }

        // Capture old values for audit
        Map<String, Object> oldValues = Map.of(
                "baseSalary", salary.getBaseSalary(),
                "bonus", salary.getBonus(),
                "deductions", salary.getDeductions(),
                "netSalary", salary.getNetSalary()
        );

        // Apply adjustments
        if (request.getBaseSalary() != null) {
            salary.setBaseSalary(request.getBaseSalary());
        }
        if (request.getBonus() != null) {
            salary.setBonus(request.getBonus());
        }
        if (request.getDeductions() != null) {
            salary.setDeductions(request.getDeductions());
        }

        // If netSalary is explicitly provided, use it; otherwise recalculate
        if (request.getNetSalary() != null) {
            salary.setNetSalary(request.getNetSalary());
        } else {
            BigDecimal netSalary = salary.getBaseSalary()
                    .add(salary.getBonus())
                    .subtract(salary.getDeductions());
            salary.setNetSalary(netSalary);
        }

        salaryRepository.save(salary);

        Map<String, Object> newValues = Map.of(
                "baseSalary", salary.getBaseSalary(),
                "bonus", salary.getBonus(),
                "deductions", salary.getDeductions(),
                "netSalary", salary.getNetSalary()
        );

        auditLogService.log(actorId, "SALARY_ADJUST", "salary",
                salaryId.toString(), oldValues, newValues, ip, ua);

        log.info("Salary {} adjusted by actor {}: baseSalary={}, bonus={}, deductions={}, netSalary={}",
                salaryId, actorId, salary.getBaseSalary(), salary.getBonus(),
                salary.getDeductions(), salary.getNetSalary());

        return toSalaryResponse(salary);
    }

    // ========================================================================
    //  APPROVE — logical approval via audit trail
    // ========================================================================

    @Transactional(transactionManager = "payrollTransactionManager", readOnly = true)
    public SalaryResponse approveSalary(Integer salaryId,
                                        Integer actorId, String ip, String ua) {

        Salary salary = salaryRepository.findByIdWithDetails(salaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Salary record not found: " + salaryId));

        Map<String, Object> approvalInfo = Map.of(
                "salaryId", salary.getSalaryId(),
                "employeeId", salary.getEmployeeId(),
                "salaryMonth", salary.getSalaryMonth().toString(),
                "baseSalary", salary.getBaseSalary(),
                "bonus", salary.getBonus(),
                "deductions", salary.getDeductions(),
                "netSalary", salary.getNetSalary()
        );

        auditLogService.log(actorId, "SALARY_APPROVE", "salary",
                salaryId.toString(), null, approvalInfo, ip, ua);

        log.info("Salary {} approved by actor {}", salaryId, actorId);

        return toSalaryResponse(salary);
    }

    // ========================================================================
    //  EXPORT — Excel report (.xlsx)
    // ========================================================================

    @Transactional(transactionManager = "payrollTransactionManager", readOnly = true)
    public byte[] exportSalaries(Integer employeeId,
                                 Integer departmentId,
                                 LocalDate salaryMonth,
                                 Integer actorId, String ip, String ua) {

        List<Salary> salaries = salaryRepository.findAllFiltered(employeeId, departmentId, salaryMonth);

        try (Workbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet("Bảng Lương");

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

            // ── Number formatting ────────────────────────────
            DataFormat dataFormat = wb.createDataFormat();

            CellStyle currencyStyle = wb.createCellStyle();
            currencyStyle.setDataFormat(dataFormat.getFormat("#,##0"));
            currencyStyle.setBorderBottom(BorderStyle.THIN);
            currencyStyle.setBorderTop(BorderStyle.THIN);
            currencyStyle.setBorderLeft(BorderStyle.THIN);
            currencyStyle.setBorderRight(BorderStyle.THIN);

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
                "Mã lương", "Mã NV", "Họ tên", "Phòng ban", "Chức vụ",
                "Tháng lương", "Lương cơ bản", "Thưởng", "Khấu trừ",
                "Thực lĩnh", "Ngày tạo"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                var cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // ── Data rows ────────────────────────────────────
            int rowIdx = 1;
            for (Salary s : salaries) {
                Row row = sheet.createRow(rowIdx++);
                EmployeePayroll emp = s.getEmployee();

                var c0 = row.createCell(0); c0.setCellValue(s.getSalaryId()); c0.setCellStyle(centerStyle);
                var c1 = row.createCell(1); c1.setCellValue(s.getEmployeeId()); c1.setCellStyle(centerStyle);

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
                c5.setCellValue(s.getSalaryMonth() != null ? s.getSalaryMonth().toString() : "");
                c5.setCellStyle(centerStyle);

                var c6 = row.createCell(6); c6.setCellValue(s.getBaseSalary().doubleValue()); c6.setCellStyle(currencyStyle);
                var c7 = row.createCell(7); c7.setCellValue(s.getBonus().doubleValue()); c7.setCellStyle(currencyStyle);
                var c8 = row.createCell(8); c8.setCellValue(s.getDeductions().doubleValue()); c8.setCellStyle(currencyStyle);
                var c9 = row.createCell(9); c9.setCellValue(s.getNetSalary().doubleValue()); c9.setCellStyle(currencyStyle);

                var c10 = row.createCell(10);
                c10.setCellValue(s.getCreatedAt() != null ? s.getCreatedAt().toString() : "");
                c10.setCellStyle(centerStyle);
            }

            // ── Auto-size columns ────────────────────────────
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                // Add a little padding
                sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 512);
            }

            wb.write(out);
            auditLogService.log(actorId, "SALARY_EXPORT", "salary",
                    null, null, buildFilterInfo(employeeId, departmentId, salaryMonth), ip, ua);

            log.info("Salary export (Excel) by actor {} — {} records", actorId, salaries.size());

            return out.toByteArray();

        } catch (IOException e) {
            throw new BusinessException("Failed to generate Excel report: " + e.getMessage());
        }
    }

    // ========================================================================
    //  Mapping helpers
    // ========================================================================

    private SalaryResponse toSalaryResponse(Salary s) {
        SalaryResponse r = new SalaryResponse();
        r.setSalaryId(s.getSalaryId());
        r.setEmployeeId(s.getEmployeeId());
        r.setSalaryMonth(s.getSalaryMonth());
        r.setBaseSalary(s.getBaseSalary());
        r.setBonus(s.getBonus());
        r.setDeductions(s.getDeductions());
        r.setNetSalary(s.getNetSalary());
        r.setCreatedAt(s.getCreatedAt());

        EmployeePayroll emp = s.getEmployee();
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

    private SalaryDetailResponse toSalaryDetailResponse(Salary s) {
        SalaryDetailResponse r = new SalaryDetailResponse();
        r.setSalaryId(s.getSalaryId());
        r.setSalaryMonth(s.getSalaryMonth());
        r.setBaseSalary(s.getBaseSalary());
        r.setBonus(s.getBonus());
        r.setDeductions(s.getDeductions());
        r.setNetSalary(s.getNetSalary());
        r.setCreatedAt(s.getCreatedAt());
        r.setEmployeeId(s.getEmployeeId());

        EmployeePayroll emp = s.getEmployee();
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

        // Attach attendance data for the same month
        List<AttendanceRecord> attendance = attendanceRepository
                .findByEmployeeIdAndMonth(s.getEmployeeId(), s.getSalaryMonth());
        if (!attendance.isEmpty()) {
            AttendanceRecord att = attendance.get(0);
            r.setWorkDays(att.getWorkDays());
            r.setAbsentDays(att.getAbsentDays());
            r.setLeaveDays(att.getLeaveDays());
        }

        return r;
    }

    private Map<String, Object> buildFilterInfo(Integer employeeId,
                                                Integer departmentId,
                                                LocalDate salaryMonth) {
        Map<String, Object> filters = new LinkedHashMap<>();
        if (employeeId != null) filters.put("employeeId", employeeId);
        if (departmentId != null) filters.put("departmentId", departmentId);
        if (salaryMonth != null) filters.put("salaryMonth", salaryMonth.toString());
        return filters.isEmpty() ? null : filters;
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
