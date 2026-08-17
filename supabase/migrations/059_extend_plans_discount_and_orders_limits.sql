-- ============================================================
-- Migration 059: Extend Plans with Discounts and Max Orders Limits
-- ============================================================

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS price_monthly_discounted NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS price_yearly_discounted NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS max_orders_monthly INTEGER NOT NULL DEFAULT 500;

-- Update seed plans with defaults
UPDATE public.plans
SET
  price_monthly_discounted = 0.00,
  price_yearly_discounted = 0.00,
  max_orders_monthly = 100
WHERE slug = 'free';

UPDATE public.plans
SET
  price_monthly_discounted = 24.00,
  price_yearly_discounted = 240.00,
  max_orders_monthly = 5000
WHERE slug = 'pro';

UPDATE public.plans
SET
  price_monthly_discounted = 79.00,
  price_yearly_discounted = 790.00,
  max_orders_monthly = -1
WHERE slug = 'enterprise';
