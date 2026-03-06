package com.companyx.synpay_dashboard.repository.hr;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.hr.Dividend;

@Repository
public interface DividendRepository extends JpaRepository<Dividend, Integer> {

    /**
     * Sum dividend amounts grouped by quarter within a date range.
     * Returns [year, quarter, totalAmount] rows.
     */
    @Query("SELECT YEAR(d.dividendDate), " +
           "CASE WHEN MONTH(d.dividendDate) <= 3 THEN 1 " +
           "     WHEN MONTH(d.dividendDate) <= 6 THEN 2 " +
           "     WHEN MONTH(d.dividendDate) <= 9 THEN 3 " +
           "     ELSE 4 END, " +
           "SUM(d.dividendAmount) " +
           "FROM Dividend d " +
           "WHERE d.dividendDate BETWEEN :startDate AND :endDate " +
           "GROUP BY YEAR(d.dividendDate), " +
           "CASE WHEN MONTH(d.dividendDate) <= 3 THEN 1 " +
           "     WHEN MONTH(d.dividendDate) <= 6 THEN 2 " +
           "     WHEN MONTH(d.dividendDate) <= 9 THEN 3 " +
           "     ELSE 4 END " +
           "ORDER BY YEAR(d.dividendDate), " +
           "CASE WHEN MONTH(d.dividendDate) <= 3 THEN 1 " +
           "     WHEN MONTH(d.dividendDate) <= 6 THEN 2 " +
           "     WHEN MONTH(d.dividendDate) <= 9 THEN 3 " +
           "     ELSE 4 END")
    List<Object[]> sumByQuarter(@Param("startDate") LocalDate startDate,
                                @Param("endDate") LocalDate endDate);

    /**
     * Total dividend amount within a date range.
     */
    @Query("SELECT COALESCE(SUM(d.dividendAmount), 0) FROM Dividend d " +
           "WHERE d.dividendDate BETWEEN :startDate AND :endDate")
    BigDecimal sumInRange(@Param("startDate") LocalDate startDate,
                          @Param("endDate") LocalDate endDate);
}
