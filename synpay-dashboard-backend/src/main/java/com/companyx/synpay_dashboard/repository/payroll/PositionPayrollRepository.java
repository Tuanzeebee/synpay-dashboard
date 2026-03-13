package com.companyx.synpay_dashboard.repository.payroll;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.payroll.PositionPayroll;

@Repository
public interface PositionPayrollRepository extends JpaRepository<PositionPayroll, Integer> {
}
