-- ============================================================
-- Migration 089: Storefronts Table and Multi-Tenant Subdomain Rules
-- ============================================================

-- 1. Create storefronts table
CREATE TABLE IF NOT EXISTS public.storefronts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  subdomain TEXT NOT NULL,
  store_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT storefronts_account_id_unique UNIQUE (account_id),
  CONSTRAINT storefronts_subdomain_unique UNIQUE (subdomain),
  CONSTRAINT storefronts_subdomain_format CHECK (
    subdomain ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'
  ),
  CONSTRAINT storefronts_subdomain_reserved CHECK (
    subdomain NOT IN (
      'www', 'app', 'api', 'admin', 'mail', 'smtp', 'ftp', 'dashboard',
      'login', 'signup', 'auth', 'store', 'stores', 'help', 'support',
      'cdn', 'static', 'assets', 'blog', 'docs', 'dev', 'staging'
    )
  )
);

-- 2. Indexes for fast lookup by subdomain and account
CREATE INDEX IF NOT EXISTS idx_storefronts_subdomain ON public.storefronts(subdomain);
CREATE INDEX IF NOT EXISTS idx_storefronts_account_id ON public.storefronts(account_id);

-- 3. Automatic updated_at timestamp trigger
DROP TRIGGER IF EXISTS set_storefronts_updated_at ON public.storefronts;
CREATE TRIGGER set_storefronts_updated_at
  BEFORE UPDATE ON public.storefronts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Multi-tenant Row Level Security (RLS)
ALTER TABLE public.storefronts ENABLE ROW LEVEL SECURITY;

-- Read: any account member can view their account storefront
DROP POLICY IF EXISTS storefronts_member_select ON public.storefronts;
CREATE POLICY storefronts_member_select ON public.storefronts
  FOR SELECT
  USING (is_account_member(account_id));

-- Read: public visitors can view active storefronts
DROP POLICY IF EXISTS storefronts_public_select ON public.storefronts;
CREATE POLICY storefronts_public_select ON public.storefronts
  FOR SELECT
  USING (is_active = true);

-- Insert: account admin+ can create storefront
DROP POLICY IF EXISTS storefronts_insert ON public.storefronts;
CREATE POLICY storefronts_insert ON public.storefronts
  FOR INSERT
  WITH CHECK (is_account_member(account_id, 'admin'));

-- Update: account admin+ can update storefront settings
DROP POLICY IF EXISTS storefronts_update ON public.storefronts;
CREATE POLICY storefronts_update ON public.storefronts
  FOR UPDATE
  USING (is_account_member(account_id, 'admin'));

-- Delete: account admin+ can delete storefront
DROP POLICY IF EXISTS storefronts_delete ON public.storefronts;
CREATE POLICY storefronts_delete ON public.storefronts
  FOR DELETE
  USING (is_account_member(account_id, 'admin'));
