package com.companyx.synpay_dashboard.repository.payroll;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.payroll.DepartmentPayroll;

@Repository
public interface DepartmentPayrollRepository extends JpaRepository<DepartmentPayroll, Integer> {
}
