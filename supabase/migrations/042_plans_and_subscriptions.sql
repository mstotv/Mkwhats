-- ============================================================
-- MIGRATION 042: Plans & Subscriptions Schema (Phase 1)
-- ============================================================

-- 1. Create Plans Table (Global Platform Table)
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  max_users INTEGER NOT NULL DEFAULT 1,
  max_whatsapp_instances INTEGER NOT NULL DEFAULT 1,
  max_contacts INTEGER NOT NULL DEFAULT 1000,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Subscriptions Table (Per-Account Multi-Tenant Table)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_ends_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for Fast Lookup & Single Active/Trialing Subscription Constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_active_account 
  ON public.subscriptions (account_id) 
  WHERE status IN ('active', 'trialing');

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions (plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_account_id ON public.subscriptions (account_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plans
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON public.plans;
CREATE POLICY "Plans are viewable by everyone" ON public.plans
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Plans are manageable by platform admins" ON public.plans;
CREATE POLICY "Plans are manageable by platform admins" ON public.plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for subscriptions (Using project's canonical helper function is_account_member)
DROP POLICY IF EXISTS "Account members can view subscription" ON public.subscriptions;
CREATE POLICY "Account members can view subscription" ON public.subscriptions
  FOR SELECT USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
    )
  );

-- 5. Set Table Grants
GRANT SELECT ON public.plans TO authenticated, anon;
GRANT ALL ON public.plans TO service_role;

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

-- 6. Insert Default Initial Seed Plans
INSERT INTO public.plans (slug, name, price_monthly, price_yearly, max_users, max_whatsapp_instances, max_contacts, features)
VALUES
  ('free', 'المجانية / Free', 0.00, 0.00, 1, 1, 500, '{"ai_assistant": false, "automations": false}'::jsonb),
  ('pro', 'المحترف / Pro', 29.00, 290.00, 5, 2, 10000, '{"ai_assistant": true, "automations": true}'::jsonb),
  ('enterprise', 'المؤسسات / Enterprise', 99.00, 990.00, -1, 10, 100000, '{"ai_assistant": true, "automations": true, "custom_webhooks": true}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_users = EXCLUDED.max_users,
  max_whatsapp_instances = EXCLUDED.max_whatsapp_instances,
  max_contacts = EXCLUDED.max_contacts,
  features = EXCLUDED.features;

-- 7. Trigger Function: Automatically Assign Default Plan ('free') to Any New Account in 'trialing' Status
CREATE OR REPLACE FUNCTION public.handle_new_account_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_plan_id UUID;
BEGIN
  SELECT id INTO v_free_plan_id FROM public.plans WHERE slug = 'free' LIMIT 1;
  
  IF v_free_plan_id IS NOT NULL THEN
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
      NOW() + INTERVAL '14 days',
      NOW() + INTERVAL '14 days'
    )
    ON CONFLICT (account_id) WHERE status IN ('active', 'trialing') DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to assign default subscription for account %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_account_subscription() OWNER TO postgres;

DROP TRIGGER IF EXISTS on_account_created_assign_subscription ON public.accounts;
CREATE TRIGGER on_account_created_assign_subscription
  AFTER INSERT ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_account_subscription();

-- 8. Backfill Subscriptions for Existing Accounts Without a Subscription (as active)
DO $$
DECLARE
  v_free_plan_id UUID;
  r RECORD;
BEGIN
  SELECT id INTO v_free_plan_id FROM public.plans WHERE slug = 'free' LIMIT 1;
  
  IF v_free_plan_id IS NOT NULL THEN
    FOR r IN SELECT id FROM public.accounts WHERE id NOT IN (SELECT account_id FROM public.subscriptions) LOOP
      INSERT INTO public.subscriptions (
        account_id,
        plan_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end
      )
      VALUES (
        r.id,
        v_free_plan_id,
        'active',
        'monthly',
        NOW(),
        NOW() + INTERVAL '1 month'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END;
$$;
