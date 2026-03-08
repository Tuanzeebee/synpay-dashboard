-- ============================================================
-- Migration: Create refresh_token table in auth_db
-- Database: MySQL (auth_db)
-- Purpose:  Stores hashed refresh tokens for secure token rotation
-- ============================================================

CREATE TABLE IF NOT EXISTS `refresh_token` (
    `id`           BIGINT       NOT NULL AUTO_INCREMENT,
    `token_hash`   VARCHAR(64)  NOT NULL COMMENT 'SHA-256 hash of the refresh token',
    `account_id`   INT          NOT NULL COMMENT 'FK → account.account_id',
    `expires_at`   DATETIME     NOT NULL COMMENT 'Token expiration timestamp',
    `revoked`      TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = token has been used or revoked',
    `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_token_hash` (`token_hash`),
    INDEX `idx_account_id` (`account_id`),
    INDEX `idx_expires_at` (`expires_at`),
    CONSTRAINT `fk_refresh_token_account`
        FOREIGN KEY (`account_id`) REFERENCES `account` (`account_id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
