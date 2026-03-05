package com.companyx.synpay_dashboard.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.dto.request.AssignAccountRequest;
import com.companyx.synpay_dashboard.dto.request.ChangeEmployeeStatusRequest;
import com.companyx.synpay_dashboard.dto.request.CreateEmployeeRequest;
import com.companyx.synpay_dashboard.dto.request.UpdateEmployeeRequest;
import com.companyx.synpay_dashboard.dto.response.EmployeePageResponse;
import com.companyx.synpay_dashboard.dto.response.EmployeeResponse;
import com.companyx.synpay_dashboard.entity.auth.Account;
import com.companyx.synpay_dashboard.entity.hr.Department;
import com.companyx.synpay_dashboard.entity.hr.Employee;
import com.companyx.synpay_dashboard.entity.hr.Position;
import com.companyx.synpay_dashboard.exceptions.BusinessException;
import com.companyx.synpay_dashboard.exceptions.ResourceNotFoundException;
import com.companyx.synpay_dashboard.repository.auth.AccountRepository;
import com.companyx.synpay_dashboard.repository.hr.DepartmentRepository;
import com.companyx.synpay_dashboard.repository.hr.EmployeeRepository;
import com.companyx.synpay_dashboard.repository.hr.PositionRepository;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

@Service
public class EmployeeService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeService.class);

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final AccountRepository accountRepository;
    private final AuditLogService auditLogService;

    public EmployeeService(EmployeeRepository employeeRepository,
                           DepartmentRepository departmentRepository,
                           PositionRepository positionRepository,
                           AccountRepository accountRepository,
                           AuditLogService auditLogService) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
        this.accountRepository = accountRepository;
        this.auditLogService = auditLogService;
    }

    // ── List with pagination & filters ───────────────────────────

    @Transactional(transactionManager = "hrTransactionManager", readOnly = true)
    public EmployeePageResponse listEmployees(Integer departmentId,
                                              Integer positionId,
                                              String status,
                                              String keyword,
                                              int page,
                                              int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "employeeId"));
        Specification<Employee> spec = buildFilterSpec(departmentId, positionId, status, keyword);

        Page<Employee> result = employeeRepository.findAll(spec, pageable);

        List<EmployeeResponse> content = result.getContent().stream()
                .map(this::toListResponse)
                .toList();

        return new EmployeePageResponse(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    // ── Get single employee detail ───────────────────────────────

    @Transactional(transactionManager = "hrTransactionManager", readOnly = true)
    public EmployeeResponse getEmployee(Integer employeeId) {
        Employee employee = employeeRepository.findByIdWithDetails(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        EmployeeResponse response = toDetailResponse(employee);

        // Look up linked account from auth DB
        try {
            Optional<Account> linkedAccount = accountRepository.findByEmployeeId(employeeId);
            linkedAccount.ifPresent(account -> {
                response.setAccountId(account.getAccountId());
                response.setAccountEmail(account.getEmail());
                response.setAccountStatus(account.getStatus());
            });
        } catch (Exception ex) {
            log.warn("Failed to look up linked account for employeeId={}: {}", employeeId, ex.getMessage());
        }

        return response;
    }

    // ── Create employee ──────────────────────────────────────────

    @Transactional(transactionManager = "hrTransactionManager")
    public EmployeeResponse createEmployee(CreateEmployeeRequest request,
                                           Integer actorAccountId,
                                           String ipAddress,
                                           String userAgent) {
        // Validate email uniqueness
        if (request.getEmail() != null && employeeRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Employee email already exists: " + request.getEmail());
        }

        // Validate foreign keys
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new BusinessException(
                        "Department not found with ID: " + request.getDepartmentId()));
        Position position = positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new BusinessException(
                        "Position not found with ID: " + request.getPositionId()));

        Employee employee = new Employee();
        employee.setFullName(request.getFullName());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setGender(request.getGender());
        employee.setPhoneNumber(request.getPhoneNumber());
        employee.setEmail(request.getEmail());
        employee.setHireDate(request.getHireDate());
        employee.setDepartment(department);
        employee.setPosition(position);
        employee.setStatus(request.getStatus() != null ? request.getStatus() : "Đang làm việc");

        employee = employeeRepository.saveAndFlush(employee);

        // Audit log
        Map<String, Object> newSnapshot = toAuditSnapshot(employee);
        newSnapshot.put("result", "SUCCESS");
        auditLogService.log(actorAccountId, "EMPLOYEE_CREATE", "employee",
                employee.getEmployeeId().toString(), null,
                newSnapshot, ipAddress, userAgent);

        log.info("Employee created: employeeId={} by actor={}",
                employee.getEmployeeId(), actorAccountId);

        return toDetailResponse(employee);
    }

    // ── Update employee profile ──────────────────────────────────

    @Transactional(transactionManager = "hrTransactionManager")
    public EmployeeResponse updateEmployee(Integer employeeId,
                                           UpdateEmployeeRequest request,
                                           Integer actorAccountId,
                                           String ipAddress,
                                           String userAgent) {
        Employee employee = employeeRepository.findByIdWithDetails(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        Map<String, Object> oldSnapshot = toAuditSnapshot(employee);

        // Update fields if provided
        if (request.getFullName() != null) {
            employee.setFullName(request.getFullName());
        }
        if (request.getDateOfBirth() != null) {
            employee.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            employee.setGender(request.getGender());
        }
        if (request.getPhoneNumber() != null) {
            employee.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getEmail() != null) {
            // Validate email uniqueness if changing
            if (!request.getEmail().equals(employee.getEmail())
                    && employeeRepository.existsByEmail(request.getEmail())) {
                throw new BusinessException("Employee email already exists: " + request.getEmail());
            }
            employee.setEmail(request.getEmail());
        }
        if (request.getHireDate() != null) {
            employee.setHireDate(request.getHireDate());
        }
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new BusinessException(
                            "Department not found with ID: " + request.getDepartmentId()));
            employee.setDepartment(department);
        }
        if (request.getPositionId() != null) {
            Position position = positionRepository.findById(request.getPositionId())
                    .orElseThrow(() -> new BusinessException(
                            "Position not found with ID: " + request.getPositionId()));
            employee.setPosition(position);
        }

        employeeRepository.saveAndFlush(employee);

        // Audit log
        Map<String, Object> newSnapshot = toAuditSnapshot(employee);
        newSnapshot.put("result", "SUCCESS");
        auditLogService.log(actorAccountId, "EMPLOYEE_UPDATE", "employee",
                employeeId.toString(), oldSnapshot,
                newSnapshot, ipAddress, userAgent);

        log.info("Employee updated: employeeId={} by actor={}", employeeId, actorAccountId);

        return toDetailResponse(employee);
    }

    // ── Change employment status ─────────────────────────────────

    @Transactional(transactionManager = "hrTransactionManager")
    public EmployeeResponse changeStatus(Integer employeeId,
                                         ChangeEmployeeStatusRequest request,
                                         Integer actorAccountId,
                                         String ipAddress,
                                         String userAgent) {
        Employee employee = employeeRepository.findByIdWithDetails(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        String oldStatus = employee.getStatus();
        String newStatus = request.getStatus();

        if (oldStatus != null && oldStatus.equals(newStatus)) {
            throw new BusinessException("Employee is already in status: " + newStatus);
        }

        employee.setStatus(newStatus);
        employeeRepository.saveAndFlush(employee);

        // Audit log
        Map<String, Object> oldSnapshot = Map.of(
                "employeeId", employeeId,
                "status", oldStatus != null ? oldStatus : ""
        );
        Map<String, Object> newSnapshot = new LinkedHashMap<>();
        newSnapshot.put("employeeId", employeeId);
        newSnapshot.put("status", newStatus);
        newSnapshot.put("result", "SUCCESS");

        auditLogService.log(actorAccountId, "EMPLOYEE_STATUS_CHANGE", "employee",
                employeeId.toString(), oldSnapshot,
                newSnapshot, ipAddress, userAgent);

        log.info("Employee status changed: employeeId={} from='{}' to='{}' by actor={}",
                employeeId, oldStatus, newStatus, actorAccountId);

        return toDetailResponse(employee);
    }

    // ── Assign account to employee ───────────────────────────────

    @Transactional(transactionManager = "authTransactionManager")
    public EmployeeResponse assignAccount(Integer employeeId,
                                          AssignAccountRequest request,
                                          Integer actorAccountId,
                                          String ipAddress,
                                          String userAgent) {
        // Verify employee exists (read from HR DB)
        Employee employee = employeeRepository.findByIdWithDetails(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        // Verify account exists (read from auth DB)
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account", request.getAccountId()));

        // Check uniqueness: no other employee should already be linked to this account
        Optional<Account> existingLink = accountRepository.findByEmployeeId(employeeId);
        if (existingLink.isPresent()
                && existingLink.get().getAccountId().equals(request.getAccountId())) {
            throw new BusinessException("This account is already linked to this employee");
        }

        // Check if the target account is already linked to a different employee
        if (account.getEmployeeId() != null && !account.getEmployeeId().equals(employeeId)) {
            throw new BusinessException(
                    "Account " + request.getAccountId() +
                    " is already linked to another employee (ID: " + account.getEmployeeId() + ")");
        }

        // Perform the linking
        Integer oldEmployeeId = account.getEmployeeId();
        account.setEmployeeId(employeeId);
        accountRepository.saveAndFlush(account);

        // Audit log
        Map<String, Object> oldSnapshot = new LinkedHashMap<>();
        oldSnapshot.put("employeeId", employeeId);
        oldSnapshot.put("accountId", oldEmployeeId != null ? request.getAccountId() : null);
        oldSnapshot.put("previousEmployeeId", oldEmployeeId);

        Map<String, Object> newSnapshot = new LinkedHashMap<>();
        newSnapshot.put("employeeId", employeeId);
        newSnapshot.put("accountId", request.getAccountId());
        newSnapshot.put("accountEmail", account.getEmail());
        newSnapshot.put("result", "SUCCESS");

        auditLogService.log(actorAccountId, "EMPLOYEE_ASSIGN_ACCOUNT", "employee",
                employeeId.toString(), oldSnapshot,
                newSnapshot, ipAddress, userAgent);

        log.info("Account assigned: employeeId={} ← accountId={} by actor={}",
                employeeId, request.getAccountId(), actorAccountId);

        // Build response with linked account info
        EmployeeResponse response = toDetailResponse(employee);
        response.setAccountId(account.getAccountId());
        response.setAccountEmail(account.getEmail());
        response.setAccountStatus(account.getStatus());
        return response;
    }

    // ── Delete employee ──────────────────────────────────────────

    @Transactional(transactionManager = "hrTransactionManager")
    public void deleteEmployee(Integer employeeId,
                               Integer actorAccountId,
                               String ipAddress,
                               String userAgent) {
        Employee employee = employeeRepository.findByIdWithDetails(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        Map<String, Object> oldSnapshot = toAuditSnapshot(employee);

        employeeRepository.delete(employee);

        auditLogService.log(actorAccountId, "EMPLOYEE_DELETE", "employee",
                employeeId.toString(), oldSnapshot, null, ipAddress, userAgent);

        log.info("Employee deleted: employeeId={} by actor={}", employeeId, actorAccountId);
    }

    // ── Private helpers ──────────────────────────────────────────

    private Specification<Employee> buildFilterSpec(Integer departmentId,
                                                   Integer positionId,
                                                   String status,
                                                   String keyword) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Ensure FETCH JOINs for the count query are skipped
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("department", JoinType.LEFT);
                root.fetch("position", JoinType.LEFT);
            }

            if (departmentId != null) {
                Join<?, ?> dept = root.join("department", JoinType.LEFT);
                predicates.add(cb.equal(dept.get("departmentId"), departmentId));
            }
            if (positionId != null) {
                Join<?, ?> pos = root.join("position", JoinType.LEFT);
                predicates.add(cb.equal(pos.get("positionId"), positionId));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("fullName")), pattern);
                Predicate emailLike = cb.like(cb.lower(root.get("email")), pattern);
                predicates.add(cb.or(nameLike, emailLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private EmployeeResponse toListResponse(Employee employee) {
        EmployeeResponse dto = new EmployeeResponse();
        dto.setEmployeeId(employee.getEmployeeId());
        dto.setFullName(employee.getFullName());
        dto.setDateOfBirth(employee.getDateOfBirth());
        dto.setGender(employee.getGender());
        dto.setPhoneNumber(employee.getPhoneNumber());
        dto.setEmail(employee.getEmail());
        dto.setHireDate(employee.getHireDate());
        dto.setStatus(employee.getStatus());
        dto.setCreatedAt(employee.getCreatedAt());
        dto.setUpdatedAt(employee.getUpdatedAt());

        if (employee.getDepartment() != null) {
            dto.setDepartmentId(employee.getDepartment().getDepartmentId());
            dto.setDepartmentName(employee.getDepartment().getDepartmentName());
        }
        if (employee.getPosition() != null) {
            dto.setPositionId(employee.getPosition().getPositionId());
            dto.setPositionName(employee.getPosition().getPositionName());
        }

        return dto;
    }

    private EmployeeResponse toDetailResponse(Employee employee) {
        // Detail includes all list fields — account info added by caller
        return toListResponse(employee);
    }

    private Map<String, Object> toAuditSnapshot(Employee employee) {
        Map<String, Object> snap = new LinkedHashMap<>();
        snap.put("employeeId", employee.getEmployeeId());
        snap.put("fullName", employee.getFullName());
        snap.put("email", employee.getEmail());
        snap.put("phoneNumber", employee.getPhoneNumber());
        snap.put("dateOfBirth", employee.getDateOfBirth());
        snap.put("gender", employee.getGender());
        snap.put("hireDate", employee.getHireDate());
        snap.put("status", employee.getStatus());
        if (employee.getDepartment() != null) {
            snap.put("departmentId", employee.getDepartment().getDepartmentId());
            snap.put("departmentName", employee.getDepartment().getDepartmentName());
        }
        if (employee.getPosition() != null) {
            snap.put("positionId", employee.getPosition().getPositionId());
            snap.put("positionName", employee.getPosition().getPositionName());
        }
        return snap;
    }
}
