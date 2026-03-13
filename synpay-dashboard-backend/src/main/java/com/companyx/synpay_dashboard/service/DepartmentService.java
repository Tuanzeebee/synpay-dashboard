package com.companyx.synpay_dashboard.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.dto.request.CreateDepartmentRequest;
import com.companyx.synpay_dashboard.dto.request.UpdateDepartmentRequest;
import com.companyx.synpay_dashboard.dto.response.DepartmentPageResponse;
import com.companyx.synpay_dashboard.dto.response.DepartmentResponse;
import com.companyx.synpay_dashboard.entity.hr.Department;
import com.companyx.synpay_dashboard.exceptions.ResourceNotFoundException;
import com.companyx.synpay_dashboard.repository.hr.DepartmentRepository;

@Service
public class DepartmentService {

    private static final Logger log = LoggerFactory.getLogger(DepartmentService.class);

    private final DepartmentRepository departmentRepository;
    private final PayrollSyncService payrollSyncService;
    private final AuditLogService auditLogService;

    public DepartmentService(DepartmentRepository departmentRepository,
                             PayrollSyncService payrollSyncService,
                             AuditLogService auditLogService) {
        this.departmentRepository = departmentRepository;
        this.payrollSyncService = payrollSyncService;
        this.auditLogService = auditLogService;
    }

    // ========================== LIST ==========================

    @Transactional(transactionManager = "hrTransactionManager", readOnly = true)
    public DepartmentPageResponse listDepartments(int page, int size) {
        size = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(page, size, Sort.by("departmentId").ascending());

        Page<Department> result = departmentRepository.findAll(pageable);

        List<DepartmentResponse> content = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new DepartmentPageResponse(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    // ========================== GET BY ID ==========================

    @Transactional(transactionManager = "hrTransactionManager", readOnly = true)
    public DepartmentResponse getDepartment(Integer id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        return toResponse(department);
    }

    // ========================== CREATE ==========================

    @Transactional(transactionManager = "hrTransactionManager")
    public DepartmentResponse createDepartment(CreateDepartmentRequest request,
                                               Integer actorAccountId,
                                               String ip, String ua) {
        try {
            // 1. Save to HR database
            Department department = new Department();
            department.setDepartmentName(request.getDepartmentName());

            department = departmentRepository.save(department);
            log.info("→ Department saved to HR DB: id={}, name={}", department.getDepartmentId(), department.getDepartmentName());

            // 2. Sync to Payroll database
            try {
                payrollSyncService.syncDepartmentCreate(department);
                log.info("✓ Department synced to both databases: id={}", department.getDepartmentId());
            } catch (Exception syncError) {
                log.error("✗ Payroll sync failed! Triggering rollback for HR data: id={}", department.getDepartmentId(), syncError);
                throw new RuntimeException("Failed to sync department to payroll database. Operation rolled back.", syncError);
            }

            DepartmentResponse response = toResponse(department);

            auditLogService.log(actorAccountId, "DEPARTMENT_CREATE", "department",
                    department.getDepartmentId().toString(), null,
                    Map.of("departmentName", department.getDepartmentName()),
                    ip, ua);

            log.info("✓ Department created successfully in both databases: id={}, name={}", 
                     department.getDepartmentId(), department.getDepartmentName());
            return response;
        } catch (RuntimeException e) {
            log.error("✗ CREATE DEPARTMENT FAILED - Transaction rolled back: {}", e.getMessage());
            throw e;
        }
    }

    // ========================== UPDATE ==========================

    @Transactional(transactionManager = "hrTransactionManager")
    public DepartmentResponse updateDepartment(Integer id,
                                               UpdateDepartmentRequest request,
                                               Integer actorAccountId,
                                               String ip, String ua) {
        try {
            // 1. Update HR database
            Department department = departmentRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Department", id));

            Map<String, Object> oldValue = Map.of(
                    "departmentName", department.getDepartmentName());

            if (request.getDepartmentName() != null) {
                department.setDepartmentName(request.getDepartmentName());
            }

            department = departmentRepository.save(department);
            log.info("→ Department updated in HR DB: id={}, name={}", id, department.getDepartmentName());

            // 2. Sync to Payroll database
            try {
                payrollSyncService.syncDepartmentUpdate(department);
                log.info("✓ Department update synced to both databases: id={}", id);
            } catch (Exception syncError) {
                log.error("✗ Payroll sync failed! Triggering rollback for HR update: id={}", id, syncError);
                throw new RuntimeException("Failed to sync department update to payroll database. Operation rolled back.", syncError);
            }

            DepartmentResponse response = toResponse(department);

            Map<String, Object> newValue = Map.of(
                    "departmentName", department.getDepartmentName());

            auditLogService.log(actorAccountId, "DEPARTMENT_UPDATE", "department",
                    id.toString(), oldValue, newValue, ip, ua);

            log.info("✓ Department updated successfully in both databases: id={}", id);
            return response;
        } catch (RuntimeException e) {
            log.error("✗ UPDATE DEPARTMENT FAILED - Transaction rolled back: {}", e.getMessage());
            throw e;
        }
    }

    // ========================== DELETE ==========================

    @Transactional(transactionManager = "hrTransactionManager")
    public void deleteDepartment(Integer id, Integer actorAccountId,
                                 String ip, String ua) {
        try {
            // 1. Get from HR database
            Department department = departmentRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Department", id));

            Map<String, Object> oldValue = Map.of(
                    "departmentName", department.getDepartmentName());

            // 2. Delete from payroll database first
            try {
                payrollSyncService.syncDepartmentDelete(id);
                log.info("→ Department deleted from Payroll DB: id={}", id);
            } catch (Exception syncError) {
                log.error("✗ Payroll deletion failed! Triggering rollback: id={}", id, syncError);
                throw new RuntimeException("Failed to delete department from payroll database. Operation rolled back.", syncError);
            }

            // 3. Delete from HR database
            departmentRepository.delete(department);
            log.info("→ Department deleted from HR DB: id={}", id);

            auditLogService.log(actorAccountId, "DEPARTMENT_DELETE", "department",
                    id.toString(), oldValue, null, ip, ua);

            log.info("✓ Department deleted successfully from both databases: id={}, name={}", id, department.getDepartmentName());
        } catch (RuntimeException e) {
            log.error("✗ DELETE DEPARTMENT FAILED - Transaction rolled back: {}", e.getMessage());
            throw e;
        }
    }

    // ========================== MAPPER ==========================

    private DepartmentResponse toResponse(Department entity) {
        DepartmentResponse dto = new DepartmentResponse();
        dto.setDepartmentId(entity.getDepartmentId());
        dto.setDepartmentName(entity.getDepartmentName());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
