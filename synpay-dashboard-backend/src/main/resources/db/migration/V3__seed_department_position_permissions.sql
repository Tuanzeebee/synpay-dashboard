-- =============================================================================
-- V3: Seed department & position permissions into auth_db
--
-- Target database : auth_db (MySQL)
-- Run against     : MySQL 8.x
--
-- The permission table uses the `key` column as a UNIQUE index,
-- so INSERT IGNORE ensures idempotency — safe to run more than once.
-- =============================================================================

-- ── Department permissions ───────────────────────────────────────

INSERT IGNORE INTO `permission` (`key`, `name`, `category`, `description`, `is_sensitive`)
VALUES
  ('department.read',  'View Departments',   'Department', 'View the list of departments and their details', 0),
  ('department.write', 'Manage Departments',  'Department', 'Create, update and change status of departments', 0);

-- ── Position permissions ─────────────────────────────────────────

INSERT IGNORE INTO `permission` (`key`, `name`, `category`, `description`, `is_sensitive`)
VALUES
  ('position.read',  'View Positions',   'Position', 'View the list of positions and their details', 0),
  ('position.write', 'Manage Positions',  'Position', 'Create, update and change status of positions', 0);

-- ── Assign to role_id = 1 (Admin) with enabled = 1 ──────────────
-- Admin should have all permissions. We look up the new permission_ids
-- and link them. INSERT IGNORE keeps it idempotent.

INSERT IGNORE INTO `role_permission` (`role_id`, `permission_id`, `enabled`)
SELECT 1, p.permission_id, 1
  FROM `permission` p
 WHERE p.`key` IN ('department.read', 'department.write', 'position.read', 'position.write');

-- ── (Optional) Assign read-only to role_id = 2 (HR Manager) ─────

INSERT IGNORE INTO `role_permission` (`role_id`, `permission_id`, `enabled`)
SELECT 2, p.permission_id, 1
  FROM `permission` p
 WHERE p.`key` IN ('department.read', 'position.read');
