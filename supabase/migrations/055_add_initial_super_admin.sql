-- ============================================================
-- Migration 055: Grant Super Admin Access to mamomeme27@gmail.com
-- ============================================================

INSERT INTO public.platform_admins (user_id)
VALUES ('26558a11-e090-414b-9f37-0d9a30194124')
ON CONFLICT (user_id) DO NOTHING;
