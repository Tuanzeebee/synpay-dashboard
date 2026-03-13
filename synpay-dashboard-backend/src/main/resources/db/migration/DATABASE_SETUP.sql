-- ============================================================================
-- Notification & Email System - Database Setup Script
-- ============================================================================
-- Run this script in auth_db to set up permissions and initial data
-- for the Notification & Email System
-- ============================================================================

-- ============================================================================
-- 1. INSERT PERMISSIONS
-- ============================================================================
-- These permission codes must match PermissionConstants.java

INSERT IGNORE INTO permission (`key`, name, category, description, is_sensitive, created_at, updated_at) VALUES
('notification.read', 'View Notifications', 'Notification', 'View in-app notifications', 0, NOW(), NOW());

INSERT IGNORE INTO permission (`key`, name, category, description, is_sensitive, created_at, updated_at) VALUES
('notification.mark_read', 'Mark Notification as Read', 'Notification', 'Mark in-app notifications as read', 0, NOW(), NOW());

INSERT IGNORE INTO permission (`key`, name, category, description, is_sensitive, created_at, updated_at) VALUES
('notification.admin', 'Admin Notifications', 'Notification', 'View all notifications (admin)', 1, NOW(), NOW());

INSERT IGNORE INTO permission (`key`, name, category, description, is_sensitive, created_at, updated_at) VALUES
('email_queue.view', 'View Email Queue', 'Email', 'View and manage email queue (admin)', 1, NOW(), NOW());

-- ============================================================================
-- 2. ASSIGN PERMISSIONS TO ADMIN ROLE
-- ============================================================================
-- Get permissions IDs
-- Run these inserts after permission inserts above

INSERT IGNORE INTO role_permission (role_id, permission_id, enabled, created_at, updated_at) VALUES
(1, (SELECT permission_id FROM permission WHERE `key` = 'notification.read'), 1, NOW(), NOW());

INSERT IGNORE INTO role_permission (role_id, permission_id, enabled, created_at, updated_at) VALUES
(1, (SELECT permission_id FROM permission WHERE `key` = 'notification.mark_read'), 1, NOW(), NOW());

INSERT IGNORE INTO role_permission (role_id, permission_id, enabled, created_at, updated_at) VALUES
(1, (SELECT permission_id FROM permission WHERE `key` = 'notification.admin'), 1, NOW(), NOW());

INSERT IGNORE INTO role_permission (role_id, permission_id, enabled, created_at, updated_at) VALUES
(1, (SELECT permission_id FROM permission WHERE `key` = 'email_queue.view'), 1, NOW(), NOW());

-- ============================================================================
-- 3. CREATE ALERT RULES
-- ============================================================================
-- Define when notifications should be triggered
-- trigger_event codes match the business logic in backend

INSERT IGNORE INTO alert_rule (code, description, trigger_event, enabled, notify_channel, created_at, updated_at) VALUES
('RULE_PAYROLL_APPROVED', 
 'Triggers when payroll is approved', 
 'PAYROLL_APPROVED', 
 1, 
 'BOTH', 
 NOW(), 
 NOW());

INSERT IGNORE INTO alert_rule (code, description, trigger_event, enabled, notify_channel, created_at, updated_at) VALUES
('RULE_ATTENDANCE_ABNORMAL', 
 'Triggers when abnormal attendance patterns detected', 
 'ATTENDANCE_ABNORMAL', 
 1, 
 'IN_APP', 
 NOW(), 
 NOW());

INSERT IGNORE INTO alert_rule (code, description, trigger_event, enabled, notify_channel, created_at, updated_at) VALUES
('RULE_LOGIN_FAILED_MULTIPLE', 
 'Triggers on multiple failed login attempts', 
 'LOGIN_FAILED_MULTIPLE', 
 1, 
 'EMAIL', 
 NOW(), 
 NOW());

INSERT IGNORE INTO alert_rule (code, description, trigger_event, enabled, notify_channel, created_at, updated_at) VALUES
('RULE_ROLE_CHANGED', 
 'Triggers when user role is changed', 
 'ROLE_CHANGED', 
 1, 
 'BOTH', 
 NOW(), 
 NOW());

INSERT IGNORE INTO alert_rule (code, description, trigger_event, enabled, notify_channel, created_at, updated_at) VALUES
('RULE_ACCOUNT_DISABLED', 
 'Triggers when account is disabled', 
 'ACCOUNT_DISABLED', 
 1, 
 'EMAIL', 
 NOW(), 
 NOW());

-- ============================================================================
-- 4. CREATE NOTIFICATION TEMPLATES
-- ============================================================================
-- Templates corresponding to trigger events
-- Supports {{placeholder}} interpolation

INSERT IGNORE INTO notification_template (code, title, content, channel, created_at, updated_at) VALUES
('PAYROLL_APPROVED', 
 'Payroll Approved', 
 'Your payroll has been approved for period {{period}}. Amount: {{amount}} VND', 
 'BOTH', 
 NOW(), 
 NOW());

INSERT IGNORE INTO notification_template (code, title, content, channel, created_at, updated_at) VALUES
('ATTENDANCE_ABNORMAL', 
 'Abnormal Attendance Detected', 
 'Abnormal attendance pattern detected for employee {{employee_name}} ({{employee_id}}) in department {{department_name}}. Please review.', 
 'IN_APP', 
 NOW(), 
 NOW());

INSERT IGNORE INTO notification_template (code, title, content, channel, created_at, updated_at) VALUES
('LOGIN_FAILED_MULTIPLE', 
 'Security Alert: Multiple Login Failures', 
 'Multiple unsuccessful login attempts have been detected on your account. If this was not you, please change your password immediately or contact system administrator.', 
 'EMAIL', 
 NOW(), 
 NOW());

INSERT IGNORE INTO notification_template (code, title, content, channel, created_at, updated_at) VALUES
('ROLE_CHANGED', 
 'Role Assignment Updated', 
 'Your role has been changed to {{new_role}} by {{changed_by_name}}. Your new permissions will take effect immediately.', 
 'BOTH', 
 NOW(), 
 NOW());

INSERT IGNORE INTO notification_template (code, title, content, channel, created_at, updated_at) VALUES
('ACCOUNT_DISABLED', 
 'Account Disabled', 
 'Your account has been disabled by administrator {{admin_name}}. Reason: {{reason}}. Contact support for more information.', 
 'EMAIL', 
 NOW(), 
 NOW());

-- ============================================================================
-- 5. VERIFY DATA
-- ============================================================================
-- Use these queries to verify the setup

-- Check permissions were inserted
SELECT 'Permissions Created:' as CheckPoint;
SELECT * FROM permission WHERE `key` LIKE 'notification.%' OR `key` = 'email_queue.view';

-- Check role permissions were mapped
SELECT 'Role Permissions Mapped:' as CheckPoint;
SELECT rp.*, p.`key`, p.name, r.code FROM role_permission rp
JOIN permission p ON rp.permission_id = p.permission_id
JOIN role r ON rp.role_id = r.role_id
WHERE p.`key` LIKE 'notification.%' OR p.`key` = 'email_queue.view';

-- Check alert rules
SELECT 'Alert Rules Created:' as CheckPoint;
SELECT * FROM alert_rule;

-- Check notification templates
SELECT 'Notification Templates Created:' as CheckPoint;
SELECT * FROM notification_template;

-- ============================================================================
-- 6. QUICK TEST SETUP (Optional)
-- ============================================================================
-- Helper procedures for manual testing

-- Procedure to create a test notification
-- CALL create_test_notification(1, 'Test notification');

DELIMITER $$

CREATE PROCEDURE create_test_notification(IN account_id INT, IN message_text VARCHAR(500))
BEGIN
    INSERT INTO notification (account_id, template_code, title, message, is_read, created_at)
    VALUES (account_id, 'PAYROLL_APPROVED', 'Test Notification', message_text, 0, NOW());
    
    SELECT LAST_INSERT_ID() as notification_id;
END $$

DELIMITER ;

-- ============================================================================
-- 7. GRANT PERMISSIONS TO SPECIFIC ROLES (Examples)
-- ============================================================================
-- Modify role_id as needed for your role structure

-- Give HR_MANAGER role notification reading permissions
-- UPDATE: Adjust if HR_MANAGER role exists (role_id = 4 in example)
-- INSERT INTO role_permission (role_id, permission_id, enabled, created_at, updated_at) VALUES
-- (4, (SELECT permission_id FROM permission WHERE `key` = 'notification.read'), 1, NOW(), NOW());

-- ============================================================================
-- 8. DISABLE ALERT RULES FOR MAINTENANCE (If Needed)
-- ============================================================================
-- Update alert_rule SET enabled = 0 WHERE code = 'RULE_PAYROLL_APPROVED';

-- ============================================================================
-- END OF SETUP SCRIPT
-- ============================================================================
-- After running this script:
-- 1. Verify all inserts were successful
-- 2. Start the Spring Boot application
-- 3. Test endpoints with a valid JWT token for an ADMIN account
-- 4. Monitor application logs for any errors
-- 5. Check audit_log table for logged operations
-- ============================================================================
-- ============================================================================
-- Insert Notification & Email Permissions
-- ============================================================================

INSERT IGNORE INTO permission (`key`, name, category, description, is_sensitive, created_at, updated_at) VALUES
('notification.read', 'View Notifications', 'Notification', 'View in-app notifications', 0, NOW(), NOW());

INSERT IGNORE INTO permission (`key`, name, category, description, is_sensitive, created_at, updated_at) VALUES
('notification.mark_read', 'Mark Notification as Read', 'Notification', 'Mark in-app notifications as read', 0, NOW(), NOW());

INSERT IGNORE INTO permission (`key`, name, category, description, is_sensitive, created_at, updated_at) VALUES
('notification.admin', 'Admin Notifications', 'Notification', 'View all notifications (admin)', 1, NOW(), NOW());

INSERT IGNORE INTO permission (`key`, name, category, description, is_sensitive, created_at, updated_at) VALUES
('email_queue.view', 'View Email Queue', 'Email', 'View and manage email queue (admin)', 1, NOW(), NOW());

-- ============================================================================
-- Gán Permissions cho ADMIN role
-- ============================================================================

INSERT IGNORE INTO role_permission (role_id, permission_id, enabled, created_at, updated_at) VALUES
(1, (SELECT permission_id FROM permission WHERE `key` = 'notification.read'), 1, NOW(), NOW());

INSERT IGNORE INTO role_permission (role_id, permission_id, enabled, created_at, updated_at) VALUES
(1, (SELECT permission_id FROM permission WHERE `key` = 'notification.mark_read'), 1, NOW(), NOW());

INSERT IGNORE INTO role_permission (role_id, permission_id, enabled, created_at, updated_at) VALUES
(1, (SELECT permission_id FROM permission WHERE `key` = 'notification.admin'), 1, NOW(), NOW());

INSERT IGNORE INTO role_permission (role_id, permission_id, enabled, created_at, updated_at) VALUES
(1, (SELECT permission_id FROM permission WHERE `key` = 'email_queue.view'), 1, NOW(), NOW());

-- ============================================================================
-- Xác minh dữ liệu đã tạo
-- ============================================================================

SELECT * FROM permission WHERE `key` LIKE 'notification.%' OR `key` = 'email_queue.view';