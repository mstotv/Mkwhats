-- Migration 065: Add social_links JSONB column to site_settings for footer social media links
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[
  {"platform": "facebook", "url": ""},
  {"platform": "instagram", "url": ""},
  {"platform": "twitter", "url": ""},
  {"platform": "linkedin", "url": ""},
  {"platform": "youtube", "url": ""}
]'::jsonb;
