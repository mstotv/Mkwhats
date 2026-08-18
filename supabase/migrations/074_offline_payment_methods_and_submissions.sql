-- ============================================================
-- MIGRATION 074: Offline Payment Methods & Receipt Proof Submissions
-- ============================================================

-- 1. Create Table for Admin-managed Offline Payment Methods
CREATE TABLE IF NOT EXISTS public.offline_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  account_name TEXT,
  account_number TEXT NOT NULL,
  logo_url TEXT,
  instructions TEXT,
  instructions_ar TEXT,
  instructions_en TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Table for User Offline Payment Receipt Proof Submissions
CREATE TABLE IF NOT EXISTS public.offline_payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  method_id UUID REFERENCES public.offline_payment_methods(id) ON DELETE SET NULL,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  transaction_ref TEXT,
  proof_image_url TEXT,
  user_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_offline_submissions_account_id ON public.offline_payment_submissions(account_id);
CREATE INDEX IF NOT EXISTS idx_offline_submissions_status ON public.offline_payment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_offline_methods_active ON public.offline_payment_methods(is_active);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.offline_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_payment_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for offline_payment_methods
DROP POLICY IF EXISTS "Offline payment methods viewable by everyone" ON public.offline_payment_methods;
CREATE POLICY "Offline payment methods viewable by everyone" ON public.offline_payment_methods
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Offline payment methods manageable by super admins" ON public.offline_payment_methods;
CREATE POLICY "Offline payment methods manageable by super admins" ON public.offline_payment_methods
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- Policies for offline_payment_submissions
DROP POLICY IF EXISTS "Account members can view offline submissions" ON public.offline_payment_submissions;
CREATE POLICY "Account members can view offline submissions" ON public.offline_payment_submissions
  FOR SELECT USING (
    public.is_account_member(account_id) OR 
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Account members can insert offline submissions" ON public.offline_payment_submissions;
CREATE POLICY "Account members can insert offline submissions" ON public.offline_payment_submissions
  FOR INSERT WITH CHECK (
    public.is_account_member(account_id, 'agent')
  );

DROP POLICY IF EXISTS "Super admins can manage offline submissions" ON public.offline_payment_submissions;
CREATE POLICY "Super admins can manage offline submissions" ON public.offline_payment_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- 5. Table Grants
GRANT SELECT ON public.offline_payment_methods TO authenticated, anon;
GRANT ALL ON public.offline_payment_methods TO service_role;

GRANT SELECT, INSERT ON public.offline_payment_submissions TO authenticated;
GRANT ALL ON public.offline_payment_submissions TO service_role;
