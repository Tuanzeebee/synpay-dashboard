package com.companyx.synpay_dashboard.repository.hr;

import java.time.LocalDate;
import java.util.List;
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

    long countByDepartmentDepartmentIdAndStatusNot(Integer departmentId, String status);

    long countByPositionPositionIdAndStatusNot(Integer positionId, String status);

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.departmentId = :deptId AND e.status IN :activeStatuses")
    long countActiveByDepartmentId(@Param("deptId") Integer departmentId,
                                   @Param("activeStatuses") java.util.List<String> activeStatuses);

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.position.positionId = :posId AND e.status IN :activeStatuses")
    long countActiveByPositionId(@Param("posId") Integer positionId,
                                 @Param("activeStatuses") java.util.List<String> activeStatuses);

    // ── Dashboard aggregate queries ──────────────────────────────

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.status IN :activeStatuses")
    long countByStatusIn(@Param("activeStatuses") List<String> activeStatuses);

    /** Employee count per department (active employees). */
    @Query("SELECT e.department.departmentId, e.department.departmentName, COUNT(e) " +
           "FROM Employee e " +
           "WHERE e.department IS NOT NULL AND e.status IN :activeStatuses " +
           "GROUP BY e.department.departmentId, e.department.departmentName " +
           "ORDER BY COUNT(e) DESC")
    List<Object[]> countByDepartmentGrouped(@Param("activeStatuses") List<String> activeStatuses);

    /** Cumulative headcount: employees hired on or before each month boundary. */
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.hireDate <= :cutoffDate AND e.status IN :activeStatuses")
    long countHiredOnOrBefore(@Param("cutoffDate") LocalDate cutoffDate,
                              @Param("activeStatuses") List<String> activeStatuses);
}
