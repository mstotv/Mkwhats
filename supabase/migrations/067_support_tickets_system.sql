-- Migration 067: In-Platform Support Tickets System
-- Enables users to open support tickets with images/attachments and communicate with platform admins.

-- 1. Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
    last_reply_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_account_id ON public.support_tickets(account_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_last_reply ON public.support_tickets(last_reply_at DESC);

-- Enable RLS on support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Account members can view support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Account members can create support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Account members can update support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Platform admins can view all support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Platform admins can manage all support tickets" ON public.support_tickets;

-- Policies for account members using is_account_member helper
CREATE POLICY "Account members can view support tickets" ON public.support_tickets
    FOR SELECT USING (is_account_member(account_id));

CREATE POLICY "Account members can create support tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (is_account_member(account_id));

CREATE POLICY "Account members can update support tickets" ON public.support_tickets
    FOR UPDATE USING (is_account_member(account_id));

-- Policies for platform admins
CREATE POLICY "Platform admins can manage all support tickets" ON public.support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
        )
    );

-- 2. Create support_ticket_messages table
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for messages
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_created_at ON public.support_ticket_messages(created_at ASC);

-- Enable RLS on support_ticket_messages
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Account members can view ticket messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Account members can send ticket messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Platform admins can manage all ticket messages" ON public.support_ticket_messages;

CREATE POLICY "Account members can view ticket messages" ON public.support_ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets st
            WHERE st.id = ticket_id AND is_account_member(st.account_id)
        )
    );

CREATE POLICY "Account members can send ticket messages" ON public.support_ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets st
            WHERE st.id = ticket_id AND is_account_member(st.account_id)
        )
    );

CREATE POLICY "Platform admins can manage all ticket messages" ON public.support_ticket_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
        )
    );

-- 3. Trigger to auto update updated_at & last_reply_at
CREATE OR REPLACE FUNCTION public.fn_update_ticket_last_reply()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.support_tickets
    SET last_reply_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_ticket_last_reply ON public.support_ticket_messages;
CREATE TRIGGER trg_update_ticket_last_reply
    AFTER INSERT ON public.support_ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_ticket_last_reply();

-- 4. Supabase Storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Authenticated users can upload support attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view support attachments" ON storage.objects;

CREATE POLICY "Authenticated users can upload support attachments" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'support-attachments');

CREATE POLICY "Anyone can view support attachments" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'support-attachments');
