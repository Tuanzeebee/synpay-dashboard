package com.companyx.synpay_dashboard.repository.payroll;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.companyx.synpay_dashboard.entity.payroll.Salary;

public interface SalaryRepository extends JpaRepository<Salary, Integer> {

    @Query("SELECT s FROM Salary s " +
           "LEFT JOIN FETCH s.employee e " +
           "LEFT JOIN FETCH e.department " +
           "LEFT JOIN FETCH e.position " +
           "WHERE s.salaryId = :id")
    Optional<Salary> findByIdWithDetails(@Param("id") Integer id);

    @Query(value = "SELECT s FROM Salary s " +
                   "LEFT JOIN FETCH s.employee e " +
                   "LEFT JOIN FETCH e.department " +
                   "LEFT JOIN FETCH e.position " +
                   "WHERE (:employeeId IS NULL OR s.employeeId = :employeeId) " +
                   "AND (:departmentId IS NULL OR e.departmentId = :departmentId) " +
                   "AND (:salaryMonth IS NULL OR s.salaryMonth = :salaryMonth)",
           countQuery = "SELECT COUNT(s) FROM Salary s " +
                        "LEFT JOIN s.employee e " +
                        "WHERE (:employeeId IS NULL OR s.employeeId = :employeeId) " +
                        "AND (:departmentId IS NULL OR e.departmentId = :departmentId) " +
                        "AND (:salaryMonth IS NULL OR s.salaryMonth = :salaryMonth)")
    Page<Salary> findFiltered(@Param("employeeId") Integer employeeId,
                              @Param("departmentId") Integer departmentId,
                              @Param("salaryMonth") LocalDate salaryMonth,
                              Pageable pageable);

    @Query("SELECT s FROM Salary s " +
           "LEFT JOIN FETCH s.employee e " +
           "LEFT JOIN FETCH e.department " +
           "LEFT JOIN FETCH e.position " +
           "WHERE (:employeeId IS NULL OR s.employeeId = :employeeId) " +
           "AND (:departmentId IS NULL OR e.departmentId = :departmentId) " +
           "AND (:salaryMonth IS NULL OR s.salaryMonth = :salaryMonth)")
    java.util.List<Salary> findAllFiltered(@Param("employeeId") Integer employeeId,
                                           @Param("departmentId") Integer departmentId,
                                           @Param("salaryMonth") LocalDate salaryMonth);

    @Query("SELECT DISTINCT s.salaryMonth FROM Salary s ORDER BY s.salaryMonth DESC")
    List<LocalDate> findDistinctSalaryMonths();
}
