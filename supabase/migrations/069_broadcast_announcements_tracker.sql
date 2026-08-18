-- Migration 069: System Broadcast Announcements Dashboard & Open Tracking
-- Creates tracking table system_broadcasts and links support_tickets to track campaign metrics.

CREATE TABLE IF NOT EXISTS public.system_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message_text TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'announcement',
    priority TEXT NOT NULL DEFAULT 'medium',
    attachments JSONB DEFAULT '[]'::jsonb,
    total_delivered INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add broadcast_id foreign key to support_tickets
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS broadcast_id UUID REFERENCES public.system_broadcasts(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_broadcast_id ON public.support_tickets(broadcast_id);

-- RLS for system_broadcasts
ALTER TABLE public.system_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can manage system_broadcasts" ON public.system_broadcasts;
CREATE POLICY "Platform admins can manage system_broadcasts" ON public.system_broadcasts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
        )
    );
