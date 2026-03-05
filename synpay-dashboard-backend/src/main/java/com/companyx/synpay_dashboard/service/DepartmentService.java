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
    private final AuditLogService auditLogService;

    public DepartmentService(DepartmentRepository departmentRepository,
                             AuditLogService auditLogService) {
        this.departmentRepository = departmentRepository;
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
        Department department = new Department();
        department.setDepartmentName(request.getDepartmentName());

        department = departmentRepository.save(department);

        DepartmentResponse response = toResponse(department);

        auditLogService.log(actorAccountId, "DEPARTMENT_CREATE", "department",
                department.getDepartmentId().toString(), null,
                Map.of("departmentName", department.getDepartmentName()),
                ip, ua);

        log.info("Department created: id={}, name={}", department.getDepartmentId(), department.getDepartmentName());
        return response;
    }

    // ========================== UPDATE ==========================

    @Transactional(transactionManager = "hrTransactionManager")
    public DepartmentResponse updateDepartment(Integer id,
                                               UpdateDepartmentRequest request,
                                               Integer actorAccountId,
                                               String ip, String ua) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));

        Map<String, Object> oldValue = Map.of(
                "departmentName", department.getDepartmentName());

        if (request.getDepartmentName() != null) {
            department.setDepartmentName(request.getDepartmentName());
        }

        department = departmentRepository.save(department);

        DepartmentResponse response = toResponse(department);

        Map<String, Object> newValue = Map.of(
                "departmentName", department.getDepartmentName());

        auditLogService.log(actorAccountId, "DEPARTMENT_UPDATE", "department",
                id.toString(), oldValue, newValue, ip, ua);

        log.info("Department updated: id={}", id);
        return response;
    }

    // ========================== DELETE ==========================

    @Transactional(transactionManager = "hrTransactionManager")
    public void deleteDepartment(Integer id, Integer actorAccountId,
                                 String ip, String ua) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));

        Map<String, Object> oldValue = Map.of(
                "departmentName", department.getDepartmentName());

        departmentRepository.delete(department);

        auditLogService.log(actorAccountId, "DEPARTMENT_DELETE", "department",
                id.toString(), oldValue, null, ip, ua);

        log.info("Department deleted: id={}, name={}", id, department.getDepartmentName());
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
