package com.companyx.synpay_dashboard.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.entity.hr.Department;
import com.companyx.synpay_dashboard.entity.hr.Position;
import com.companyx.synpay_dashboard.entity.payroll.DepartmentPayroll;
import com.companyx.synpay_dashboard.entity.payroll.PositionPayroll;
import com.companyx.synpay_dashboard.repository.payroll.DepartmentPayrollRepository;
import com.companyx.synpay_dashboard.repository.payroll.PositionPayrollRepository;

/**
 * Handles synchronization of HR data to Payroll database.
 * Uses separate transaction manager to ensure payroll writes are committed independently.
 */
@Service
public class PayrollSyncService {

    private static final Logger log = LoggerFactory.getLogger(PayrollSyncService.class);

    private final DepartmentPayrollRepository departmentPayrollRepository;
    private final PositionPayrollRepository positionPayrollRepository;

    public PayrollSyncService(DepartmentPayrollRepository departmentPayrollRepository,
                              PositionPayrollRepository positionPayrollRepository) {
        this.departmentPayrollRepository = departmentPayrollRepository;
        this.positionPayrollRepository = positionPayrollRepository;
    }

    // ========================== DEPARTMENT SYNC ==========================

    @Transactional(transactionManager = "payrollTransactionManager")
    public void syncDepartmentCreate(Department department) {
        try {
            DepartmentPayroll payrollDept = new DepartmentPayroll();
            payrollDept.setDepartmentId(department.getDepartmentId());
            payrollDept.setDepartmentName(department.getDepartmentName());
            
            departmentPayrollRepository.save(payrollDept);
            log.info("✓ Department synced to payroll: id={}, name={}",
                    department.getDepartmentId(), department.getDepartmentName());
        } catch (Exception e) {
            log.error("✗ Failed to sync department to payroll: id={}", department.getDepartmentId(), e);
            throw new RuntimeException("Failed to sync department to payroll database", e);
        }
    }

    @Transactional(transactionManager = "payrollTransactionManager")
    public void syncDepartmentUpdate(Department department) {
        try {
            DepartmentPayroll payrollDept = departmentPayrollRepository.findById(department.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException(
                            "Department not found in payroll DB: id=" + department.getDepartmentId()));
            
            payrollDept.setDepartmentName(department.getDepartmentName());
            departmentPayrollRepository.save(payrollDept);
            
            log.info("✓ Department updated in payroll: id={}, name={}",
                    department.getDepartmentId(), department.getDepartmentName());
        } catch (Exception e) {
            log.error("✗ Failed to update department in payroll: id={}", department.getDepartmentId(), e);
            throw new RuntimeException("Failed to update department in payroll database", e);
        }
    }

    @Transactional(transactionManager = "payrollTransactionManager")
    public void syncDepartmentDelete(Integer departmentId) {
        try {
            departmentPayrollRepository.deleteById(departmentId);
            log.info("✓ Department deleted from payroll: id={}", departmentId);
        } catch (Exception e) {
            log.error("✗ Failed to delete department from payroll: id={}", departmentId, e);
            throw new RuntimeException("Failed to delete department from payroll database", e);
        }
    }

    // ========================== POSITION SYNC ==========================

    @Transactional(transactionManager = "payrollTransactionManager")
    public void syncPositionCreate(Position position) {
        try {
            PositionPayroll payrollPos = new PositionPayroll();
            payrollPos.setPositionId(position.getPositionId());
            payrollPos.setPositionName(position.getPositionName());
            
            positionPayrollRepository.save(payrollPos);
            log.info("✓ Position synced to payroll: id={}, name={}",
                    position.getPositionId(), position.getPositionName());
        } catch (Exception e) {
            log.error("✗ Failed to sync position to payroll: id={}", position.getPositionId(), e);
            throw new RuntimeException("Failed to sync position to payroll database", e);
        }
    }

    @Transactional(transactionManager = "payrollTransactionManager")
    public void syncPositionUpdate(Position position) {
        try {
            PositionPayroll payrollPos = positionPayrollRepository.findById(position.getPositionId())
                    .orElseThrow(() -> new RuntimeException(
                            "Position not found in payroll DB: id=" + position.getPositionId()));
            
            payrollPos.setPositionName(position.getPositionName());
            positionPayrollRepository.save(payrollPos);
            
            log.info("✓ Position updated in payroll: id={}, name={}",
                    position.getPositionId(), position.getPositionName());
        } catch (Exception e) {
            log.error("✗ Failed to update position in payroll: id={}", position.getPositionId(), e);
            throw new RuntimeException("Failed to update position in payroll database", e);
        }
    }

    @Transactional(transactionManager = "payrollTransactionManager")
    public void syncPositionDelete(Integer positionId) {
        try {
            positionPayrollRepository.deleteById(positionId);
            log.info("✓ Position deleted from payroll: id={}", positionId);
        } catch (Exception e) {
            log.error("✗ Failed to delete position from payroll: id={}", positionId, e);
            throw new RuntimeException("Failed to delete position from payroll database", e);
        }
    }
}
