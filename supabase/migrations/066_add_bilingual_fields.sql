-- Migration 066: Add bilingual English fields to content_pages and plans tables

ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS content_html_en TEXT;

ALTER TABLE plans ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_en TEXT;
