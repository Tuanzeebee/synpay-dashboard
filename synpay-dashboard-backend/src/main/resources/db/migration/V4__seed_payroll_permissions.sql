-- =============================================================================
-- V4: Seed payroll permissions into auth_db
--
-- Target database : auth_db (MySQL)
-- Run against     : MySQL 8.x
--
-- INSERT IGNORE ensures idempotency — safe to run more than once.
-- =============================================================================

-- ── Payroll permissions ──────────────────────────────────────────

INSERT IGNORE INTO `permission` (`key`, `name`, `category`, `description`, `is_sensitive`)
VALUES
  ('payroll.read',    'View Payroll',    'Payroll', 'View salary records and payroll data',            0),
  ('payroll.write',   'Manage Payroll',  'Payroll', 'Create and adjust salary records',                0),
  ('payroll.approve', 'Approve Payroll', 'Payroll', 'Approve salary changes and payroll submissions',  1),
  ('payroll.export',  'Export Payroll',  'Payroll', 'Export salary reports as Excel files',             0);

-- ── Assign ALL payroll permissions to Admin (role_id = 1) ────────

INSERT IGNORE INTO `role_permission` (`role_id`, `permission_id`, `enabled`)
SELECT 1, p.permission_id, 1
  FROM `permission` p
 WHERE p.`key` IN ('payroll.read', 'payroll.write', 'payroll.approve', 'payroll.export');

-- ── Assign read + export to HR Manager (role_id = 2) ─────────────

INSERT IGNORE INTO `role_permission` (`role_id`, `permission_id`, `enabled`)
SELECT 2, p.permission_id, 1
  FROM `permission` p
 WHERE p.`key` IN ('payroll.read', 'payroll.export');
-- =============================================================================
-- V5: Seed report permissions into auth_db
--
-- Target database : auth_db (MySQL)
-- Run against     : MySQL 8.x
--
-- INSERT IGNORE ensures idempotency — safe to run more than once.
-- =============================================================================

-- ── Report permissions ───────────────────────────────────────────

INSERT IGNORE INTO `permission` (`key`, `name`, `category`, `description`, `is_sensitive`)
VALUES
  ('report.view_dashboard', 'View Dashboard Report', 'Report', 'View dashboard overview and KPIs',         0),
  ('report.view_hr',        'View HR Report',        'Report', 'View HR employee and department metrics',   0),
  ('report.view_payroll',   'View Payroll Report',   'Report', 'View payroll salary trends and dividends',  0),
  ('report.export',         'Export Report',         'Report', 'Export full report data as CSV/PDF',         0);

-- ── Assign ALL report permissions to Admin (role_id = 1) ─────────

INSERT IGNORE INTO `role_permission` (`role_id`, `permission_id`, `enabled`)
SELECT 1, p.permission_id, 1
  FROM `permission` p
 WHERE p.`key` IN ('report.view_dashboard', 'report.view_hr', 'report.view_payroll', 'report.export');

-- ── Assign dashboard + hr view to HR Manager (role_id = 2) ──────

INSERT IGNORE INTO `role_permission` (`role_id`, `permission_id`, `enabled`)
SELECT 2, p.permission_id, 1
  FROM `permission` p
 WHERE p.`key` IN ('report.view_dashboard', 'report.view_hr');