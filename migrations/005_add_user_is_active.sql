-- Migration: 005_add_user_is_active
-- Description: Add is_active column to users table for account activation status

ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
