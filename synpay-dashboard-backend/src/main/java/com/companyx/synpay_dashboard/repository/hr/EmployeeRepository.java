package com.companyx.synpay_dashboard.repository.hr;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.hr.Employee;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Integer>,
        JpaSpecificationExecutor<Employee> {

    boolean existsByEmail(String email);

    @Query("SELECT e FROM Employee e " +
           "LEFT JOIN FETCH e.department " +
           "LEFT JOIN FETCH e.position " +
           "WHERE e.employeeId = :id")
    Optional<Employee> findByIdWithDetails(@Param("id") Integer id);
}
