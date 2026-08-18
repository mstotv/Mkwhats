-- Migration 068: Support Broadcast Notifications & Read Tracking
-- Enables platform admins to send announcements/offers to all users via support tickets,
-- and tracks unread notifications with live visual badges and direct navigation.

ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS is_read_by_user BOOLEAN DEFAULT false;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT false;

-- Create index for unread tickets performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_is_read ON public.support_tickets(account_id, is_read_by_user);

-- Function to mark a ticket as read by user
CREATE OR REPLACE FUNCTION public.fn_mark_ticket_as_read(p_ticket_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.support_tickets
  SET is_read_by_user = true
  WHERE id = p_ticket_id AND is_account_member(account_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_mark_ticket_as_read(UUID) TO authenticated;
