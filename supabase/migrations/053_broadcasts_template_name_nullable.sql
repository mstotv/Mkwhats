-- Migration 053: Make broadcasts.template_name nullable for Evolution API / free-text broadcasts
ALTER TABLE broadcasts ALTER COLUMN template_name DROP NOT NULL;
