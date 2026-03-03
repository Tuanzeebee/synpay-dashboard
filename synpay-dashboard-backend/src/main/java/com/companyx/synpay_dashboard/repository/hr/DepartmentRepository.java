package com.companyx.synpay_dashboard.repository.hr;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.hr.Department;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Integer> {
}
