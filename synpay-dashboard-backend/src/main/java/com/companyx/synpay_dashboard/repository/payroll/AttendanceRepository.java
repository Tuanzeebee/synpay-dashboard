package com.companyx.synpay_dashboard.repository.payroll;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.companyx.synpay_dashboard.entity.payroll.AttendanceRecord;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Integer> {

    @Query("SELECT a FROM AttendanceRecord a " +
           "WHERE a.employeeId = :employeeId AND a.attendanceMonth = :month")
    List<AttendanceRecord> findByEmployeeIdAndMonth(@Param("employeeId") Integer employeeId,
                                                    @Param("month") LocalDate month);

    @Query("SELECT a FROM AttendanceRecord a " +
           "LEFT JOIN FETCH a.employee e " +
           "LEFT JOIN FETCH e.department " +
           "LEFT JOIN FETCH e.position " +
           "WHERE a.attendanceId = :id")
    Optional<AttendanceRecord> findByIdWithDetails(@Param("id") Integer id);

    @Query(value = "SELECT a FROM AttendanceRecord a " +
                   "LEFT JOIN FETCH a.employee e " +
                   "LEFT JOIN FETCH e.department " +
                   "LEFT JOIN FETCH e.position " +
                   "WHERE (:employeeId IS NULL OR a.employeeId = :employeeId) " +
                   "AND (:departmentId IS NULL OR e.departmentId = :departmentId) " +
                   "AND (:attendanceMonth IS NULL OR a.attendanceMonth = :attendanceMonth)",
           countQuery = "SELECT COUNT(a) FROM AttendanceRecord a " +
                        "LEFT JOIN a.employee e " +
                        "WHERE (:employeeId IS NULL OR a.employeeId = :employeeId) " +
                        "AND (:departmentId IS NULL OR e.departmentId = :departmentId) " +
                        "AND (:attendanceMonth IS NULL OR a.attendanceMonth = :attendanceMonth)")
    Page<AttendanceRecord> findFiltered(@Param("employeeId") Integer employeeId,
                                        @Param("departmentId") Integer departmentId,
                                        @Param("attendanceMonth") LocalDate attendanceMonth,
                                        Pageable pageable);

    @Query("SELECT a FROM AttendanceRecord a " +
           "LEFT JOIN FETCH a.employee e " +
           "LEFT JOIN FETCH e.department " +
           "LEFT JOIN FETCH e.position " +
           "WHERE (:employeeId IS NULL OR a.employeeId = :employeeId) " +
           "AND (:departmentId IS NULL OR e.departmentId = :departmentId) " +
           "AND (:attendanceMonth IS NULL OR a.attendanceMonth = :attendanceMonth)")
    List<AttendanceRecord> findAllFiltered(@Param("employeeId") Integer employeeId,
                                           @Param("departmentId") Integer departmentId,
                                           @Param("attendanceMonth") LocalDate attendanceMonth);

    // ── Dashboard aggregate queries ──────────────────────────────

    /** Sum of leave days for a given month. */
    @Query("SELECT COALESCE(SUM(a.leaveDays), 0) FROM AttendanceRecord a WHERE a.attendanceMonth = :month")
    int sumLeaveDaysByMonth(@Param("month") LocalDate month);

    /** Sum of absent days for a given month. */
    @Query("SELECT COALESCE(SUM(a.absentDays), 0) FROM AttendanceRecord a WHERE a.attendanceMonth = :month")
    int sumAbsentDaysByMonth(@Param("month") LocalDate month);

    /** Sum of work days for a given month. */
    @Query("SELECT COALESCE(SUM(a.workDays), 0) FROM AttendanceRecord a WHERE a.attendanceMonth = :month")
    int sumWorkDaysByMonth(@Param("month") LocalDate month);
}
