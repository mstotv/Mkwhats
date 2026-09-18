-- ============================================================
-- MIGRATION 094: Add Configurable Trial Days to Plans & Subscriptions
-- ============================================================

-- 1. Add trial_days column to public.plans table
-- Value rules:
--   0: No free trial (immediate activation upon subscription/creation)
--   1+: Number of free trial days (e.g. 7, 14, 30 days)
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS trial_days INTEGER NOT NULL DEFAULT 14;

-- 2. Update existing seed plans with configurable trial days
UPDATE public.plans
SET trial_days = 14
WHERE slug = 'free' AND (trial_days IS NULL OR trial_days = 0);

UPDATE public.plans
SET trial_days = 14
WHERE slug = 'pro' AND (trial_days IS NULL OR trial_days = 0);

UPDATE public.plans
SET trial_days = 14
WHERE slug IN ('enterprise', 'unlimited') AND (trial_days IS NULL OR trial_days = 0);

-- 3. Update Trigger Function to respect the plan's trial_days setting
CREATE OR REPLACE FUNCTION public.handle_new_account_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_plan_id UUID;
  v_trial_days INTEGER;
BEGIN
  -- First try to find plan with slug 'free'
  SELECT id, COALESCE(trial_days, 14) INTO v_free_plan_id, v_trial_days 
  FROM public.plans 
  WHERE slug = 'free' 
  LIMIT 1;
  
  -- Fallback to the lowest priced active plan if 'free' slug does not exist
  IF v_free_plan_id IS NULL THEN
    SELECT id, COALESCE(trial_days, 14) INTO v_free_plan_id, v_trial_days 
    FROM public.plans 
    WHERE is_active = true 
    ORDER BY price_monthly ASC 
    LIMIT 1;
  END IF;
  
  IF v_free_plan_id IS NOT NULL THEN
    IF v_trial_days > 0 THEN
      -- Create trial subscription with specific trial duration
      INSERT INTO public.subscriptions (
        account_id,
        plan_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        trial_ends_at
      )
      VALUES (
        NEW.id,
        v_free_plan_id,
        'trialing',
        'monthly',
        NOW(),
        NOW() + (v_trial_days || ' days')::INTERVAL,
        NOW() + (v_trial_days || ' days')::INTERVAL
      )
      ON CONFLICT (account_id) WHERE status IN ('active', 'trialing') DO NOTHING;
    ELSE
      -- Immediate active subscription if trial_days is 0
      INSERT INTO public.subscriptions (
        account_id,
        plan_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        trial_ends_at
      )
      VALUES (
        NEW.id,
        v_free_plan_id,
        'active',
        'monthly',
        NOW(),
        NOW() + INTERVAL '10 years',
        NULL
      )
      ON CONFLICT (account_id) WHERE status IN ('active', 'trialing') DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to assign default subscription for account %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_account_subscription() OWNER TO postgres;
