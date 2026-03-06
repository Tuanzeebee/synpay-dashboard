package com.companyx.synpay_dashboard.utils;

/**
 * Holds the permission key constants used for RBAC checks.
 * These must match the {@code key} column values seeded in the
 * {@code permission} table of auth_db.
 */
public final class PermissionConstants {

    private PermissionConstants() {}

    // ---- User Management ----
    public static final String USER_READ  = "user.read";
    public static final String USER_WRITE = "user.write";

    // ---- Role Management ----
    public static final String ROLE_READ  = "role.read";
    public static final String ROLE_WRITE = "role.write";

    // ---- Permission Management ----
    public static final String PERMISSION_READ   = "permission.read";
    public static final String PERMISSION_WRITE  = "permission.write";
    public static final String PERMISSION_ASSIGN = "permission.assign";

    // ---- Permission Matrix ----
    public static final String PERMISSION_MATRIX_READ  = "permission_matrix.read";
    public static final String PERMISSION_MATRIX_WRITE = "permission_matrix.write";

    // ---- Employee Management ----
    public static final String EMPLOYEE_READ           = "employee.read";
    public static final String EMPLOYEE_WRITE          = "employee.write";
    public static final String EMPLOYEE_DISABLE        = "employee.disable";
    public static final String EMPLOYEE_ASSIGN_ACCOUNT = "employee.assign_account";

    // ---- Audit Log ----
    public static final String AUDIT_READ       = "audit.read";
    public static final String AUDIT_LOG_EXPORT = "audit.export";

    // ---- Department Management ----
    public static final String DEPARTMENT_READ  = "department.read";
    public static final String DEPARTMENT_WRITE = "department.write";

    // ---- Position Management ----
    public static final String POSITION_READ  = "position.read";
    public static final String POSITION_WRITE = "position.write";

    // ---- Payroll Management ----
    public static final String PAYROLL_READ    = "payroll.read";
    public static final String PAYROLL_WRITE   = "payroll.write";
    public static final String PAYROLL_APPROVE = "payroll.approve";
    public static final String PAYROLL_EXPORT  = "payroll.export";

    // ---- Attendance Management ----
    public static final String ATTENDANCE_READ    = "attendance.read";
    public static final String ATTENDANCE_WRITE   = "attendance.write";
    public static final String ATTENDANCE_APPROVE = "attendance.approve";
    public static final String ATTENDANCE_EXPORT  = "attendance.export";

    // ---- Reports & Analytics ----
    public static final String REPORT_VIEW_DASHBOARD = "report.view_dashboard";
    public static final String REPORT_VIEW_HR        = "report.view_hr";
    public static final String REPORT_VIEW_PAYROLL   = "report.view_payroll";
    public static final String REPORT_EXPORT         = "report.export";
}
