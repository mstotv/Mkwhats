-- ============================================================
-- MIGRATION 092: Plan Bio Link Feature & Subdomain Change Limits
-- ============================================================

-- 1. Add max_subdomain_changes to public.plans table
-- Value rules:
--   -1: Unlimited subdomain changes
--    0: Can set once upon creation, 0 changes allowed afterwards
--   1+: Number of changes allowed after initial creation
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS max_subdomain_changes INTEGER NOT NULL DEFAULT 0;

-- 2. Add subdomain_changes_count to public.storefronts table
-- Tracks the number of times the subdomain has been modified after initial creation
ALTER TABLE public.storefronts
  ADD COLUMN IF NOT EXISTS subdomain_changes_count INTEGER NOT NULL DEFAULT 0;

-- 3. Update existing seed plans with bio_link feature and max_subdomain_changes
-- Free plan: Bio link disabled, 0 changes
UPDATE public.plans
SET
  max_subdomain_changes = 0,
  features = jsonb_set(
    COALESCE(features::jsonb, '{}'::jsonb),
    '{bio_link}',
    'false'::jsonb,
    true
  )
WHERE slug = 'free';

-- Pro plan: Bio link enabled, 1 subdomain change allowed
UPDATE public.plans
SET
  max_subdomain_changes = 1,
  features = jsonb_set(
    COALESCE(features::jsonb, '{}'::jsonb),
    '{bio_link}',
    'true'::jsonb,
    true
  )
WHERE slug = 'pro';

-- Enterprise & Unlimited plans: Bio link enabled, 5 subdomain changes (or configurable)
UPDATE public.plans
SET
  max_subdomain_changes = 5,
  features = jsonb_set(
    COALESCE(features::jsonb, '{}'::jsonb),
    '{bio_link}',
    'true'::jsonb,
    true
  )
WHERE slug IN ('enterprise', 'unlimited');

-- For any other existing plans without bio_link, default to false if not set
UPDATE public.plans
SET
  features = jsonb_set(
    COALESCE(features::jsonb, '{}'::jsonb),
    '{bio_link}',
    'false'::jsonb,
    true
  )
WHERE slug NOT IN ('free', 'pro', 'enterprise', 'unlimited')
  AND (features IS NULL OR NOT (features ? 'bio_link'));
