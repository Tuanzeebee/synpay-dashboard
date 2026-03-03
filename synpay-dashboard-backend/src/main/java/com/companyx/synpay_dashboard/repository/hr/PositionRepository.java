package com.companyx.synpay_dashboard.repository.hr;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.companyx.synpay_dashboard.entity.hr.Position;

@Repository
public interface PositionRepository extends JpaRepository<Position, Integer> {
}
