-- ============================================================
-- Migration 091: Storefront Analytics (Visits & Link Clicks)
-- ============================================================

-- 1. Table for tracking storefront page visits
CREATE TABLE IF NOT EXISTS public.storefront_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  storefront_id UUID NOT NULL REFERENCES public.storefronts(id) ON DELETE CASCADE,
  visitor_ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sf_visits_account_id ON public.storefront_visits(account_id);
CREATE INDEX IF NOT EXISTS idx_sf_visits_storefront_id ON public.storefront_visits(storefront_id);
CREATE INDEX IF NOT EXISTS idx_sf_visits_visited_at ON public.storefront_visits(visited_at);

-- 2. Table for tracking button & link clicks
CREATE TABLE IF NOT EXISTS public.storefront_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  storefront_id UUID NOT NULL REFERENCES public.storefronts(id) ON DELETE CASCADE,
  link_id TEXT NOT NULL,
  link_title TEXT,
  link_url TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sf_clicks_account_id ON public.storefront_link_clicks(account_id);
CREATE INDEX IF NOT EXISTS idx_sf_clicks_storefront_id ON public.storefront_link_clicks(storefront_id);
CREATE INDEX IF NOT EXISTS idx_sf_clicks_link_id ON public.storefront_link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_sf_clicks_clicked_at ON public.storefront_link_clicks(clicked_at);

-- 3. Row Level Security (RLS)
ALTER TABLE public.storefront_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_link_clicks ENABLE ROW LEVEL SECURITY;

-- Read policies: account members can view their own storefront analytics
DROP POLICY IF EXISTS storefront_visits_member_select ON public.storefront_visits;
CREATE POLICY storefront_visits_member_select ON public.storefront_visits
  FOR SELECT
  USING (is_account_member(account_id));

DROP POLICY IF EXISTS storefront_link_clicks_member_select ON public.storefront_link_clicks;
CREATE POLICY storefront_link_clicks_member_select ON public.storefront_link_clicks
  FOR SELECT
  USING (is_account_member(account_id));

-- Insert policies: allow public / service role to record visits and clicks
DROP POLICY IF EXISTS storefront_visits_insert ON public.storefront_visits;
CREATE POLICY storefront_visits_insert ON public.storefront_visits
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS storefront_link_clicks_insert ON public.storefront_link_clicks;
CREATE POLICY storefront_link_clicks_insert ON public.storefront_link_clicks
  FOR INSERT
  WITH CHECK (true);

-- Delete policies: admins can clear analytics if needed
DROP POLICY IF EXISTS storefront_visits_admin_delete ON public.storefront_visits;
CREATE POLICY storefront_visits_admin_delete ON public.storefront_visits
  FOR DELETE
  USING (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS storefront_link_clicks_admin_delete ON public.storefront_link_clicks;
CREATE POLICY storefront_link_clicks_admin_delete ON public.storefront_link_clicks
  FOR DELETE
  USING (is_account_member(account_id, 'admin'));
