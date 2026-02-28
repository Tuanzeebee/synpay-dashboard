package com.companyx.synpay_dashboard.repository.auth;

import com.companyx.synpay_dashboard.entity.auth.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
