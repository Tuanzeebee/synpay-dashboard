package com.companyx.synpay_dashboard.repository.payroll;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.payroll.EmployeePayroll;

@Repository
public interface EmployeePayrollRepository extends JpaRepository<EmployeePayroll, Integer> {
}
