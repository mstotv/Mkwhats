-- ============================================================
-- Migration 075: Payment Approval & Rejection Notifications
-- ============================================================

-- Drop restrictive type check constraint on notifications table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_type_check'
  ) THEN
    ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
  END IF;
END $$;
