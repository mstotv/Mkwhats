-- ============================================================
-- MIGRATION 094: White-Label Resellers Core Schema
-- ============================================================

-- 1. Create Reseller Plans Table (Tiers sold to resellers by platform owner)
CREATE TABLE IF NOT EXISTS public.reseller_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT UNIQUE NOT NULL,
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  max_accounts INTEGER NOT NULL DEFAULT 10,
  max_custom_domains INTEGER NOT NULL DEFAULT 1,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Resellers Table (White-label tenants)
CREATE TABLE IF NOT EXISTS public.resellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.reseller_plans(id) ON DELETE RESTRICT,
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  display_name TEXT NOT NULL,
  display_name_ar TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#10b981',
  support_email TEXT,
  support_whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'grace_period', 'suspended', 'pending_setup')),
  subscription_expires_at TIMESTAMPTZ,
  grace_period_ends_at TIMESTAMPTZ,
  custom_max_accounts INTEGER,
  custom_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Resellers
CREATE INDEX IF NOT EXISTS idx_resellers_subdomain ON public.resellers(subdomain);
CREATE INDEX IF NOT EXISTS idx_resellers_custom_domain ON public.resellers(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resellers_status ON public.resellers(status);
CREATE INDEX IF NOT EXISTS idx_resellers_owner_account ON public.resellers(owner_account_id);

-- 3. Create Reseller Admins Table
CREATE TABLE IF NOT EXISTS public.reseller_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT idx_reseller_admin_unique UNIQUE (reseller_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reseller_admins_user ON public.reseller_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_reseller_admins_reseller ON public.reseller_admins(reseller_id);

-- 4. Connect Accounts to Reseller (Nullable for direct platform accounts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'accounts' AND column_name = 'reseller_id'
  ) THEN
    ALTER TABLE public.accounts
      ADD COLUMN reseller_id UUID REFERENCES public.resellers(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_accounts_reseller_id ON public.accounts(reseller_id) WHERE reseller_id IS NOT NULL;

-- 5. Connect Plans to Reseller (Nullable for direct platform plans)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'reseller_id'
  ) THEN
    ALTER TABLE public.plans
      ADD COLUMN reseller_id UUID REFERENCES public.resellers(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_plans_reseller_id ON public.plans(reseller_id) WHERE reseller_id IS NOT NULL;

-- 6. Create Reseller Updates & Feature Announcements Table
CREATE TABLE IF NOT EXISTS public.reseller_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT,
  content TEXT NOT NULL,
  content_ar TEXT,
  category TEXT NOT NULL DEFAULT 'feature' CHECK (category IN ('feature', 'update', 'announcement', 'maintenance')),
  badge TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial Reseller Plans if empty
INSERT INTO public.reseller_plans (name, name_ar, slug, price_monthly, price_yearly, max_accounts, max_custom_domains, features, is_popular, sort_order)
VALUES 
(
  'Reseller Starter',
  'ريسيلر المبتدئ',
  'reseller-starter',
  49.00,
  490.00,
  15,
  1,
  '{"custom_branding": true, "subdomain": true, "custom_domain": false, "ai_bots": true, "whatsapp_qr": true, "biolink": true, "storefronts": true, "support": "email"}'::jsonb,
  false,
  1
),
(
  'Reseller Pro',
  'ريسيلر المتقدم',
  'reseller-pro',
  99.00,
  990.00,
  50,
  3,
  '{"custom_branding": true, "subdomain": true, "custom_domain": true, "ai_bots": true, "whatsapp_qr": true, "biolink": true, "storefronts": true, "payment_gateways": true, "support": "priority"}'::jsonb,
  true,
  2
),
(
  'Reseller Enterprise',
  'ريسيلر المؤسسات غير محدود',
  'reseller-enterprise',
  199.00,
  1990.00,
  200,
  10,
  '{"custom_branding": true, "subdomain": true, "custom_domain": true, "ai_bots": true, "whatsapp_qr": true, "biolink": true, "storefronts": true, "payment_gateways": true, "custom_css": true, "support": "vip_24_7"}'::jsonb,
  false,
  3
)
ON CONFLICT (slug) DO NOTHING;
