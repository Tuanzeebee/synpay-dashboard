-- =============================================================================
-- V4: Seed contract permissions into auth_db
--
-- Target database : auth_db (MySQL)
-- Run against     : MySQL 8.x
--
-- The permission table uses the `key` column as a UNIQUE index,
-- so INSERT IGNORE ensures idempotency — safe to run more than once.
-- =============================================================================

-- ── Contract permissions ───────────────────────────────────────

INSERT IGNORE INTO `permission` (`key`, `name`, `category`, `description`, `is_sensitive`)
VALUES
  ('contract.read',  'View Contracts',   'Contract', 'View the list of contracts and their details', 0),
  ('contract.write', 'Manage Contracts',  'Contract', 'Create, update and change status of contracts', 0),
  ('contract.create', 'Create Contracts',  'Contract', 'Create new contracts', 0),
  ('contract.delete', 'Delete Contracts',  'Contract', 'Delete contracts', 0);

-- ── Assign to role_id = 1 (Admin) with enabled = 1 ──────────────
-- Admin should have all permissions. We look up the new permission_ids
-- and link them. INSERT IGNORE keeps it idempotent.

INSERT IGNORE INTO `role_permission` (`role_id`, `permission_id`, `enabled`)
SELECT 1, p.permission_id, 1
  FROM `permission` p
 WHERE p.`key` IN ('contract.read', 'contract.write', 'contract.create', 'contract.delete');

-- ── (Optional) Assign read-only to role_id = 2 (HR Manager) ─────

INSERT IGNORE INTO `role_permission` (`role_id`, `permission_id`, `enabled`)
SELECT 2, p.permission_id, 1
  FROM `permission` p
 WHERE p.`key` IN ('contract.read');
