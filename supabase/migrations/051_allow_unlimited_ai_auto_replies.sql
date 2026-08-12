-- Migration 051: Allow unlimited (-1) or higher range (1-500) for auto_reply_max_per_conversation
-- Drop existing constraint (auto_reply_max_per_conversation BETWEEN 1 AND 20)
ALTER TABLE ai_configs
  DROP CONSTRAINT IF EXISTS ai_configs_auto_reply_max_per_conversation_check;

-- Add updated check constraint allowing -1 (unlimited) or 1..500
ALTER TABLE ai_configs
  ADD CONSTRAINT ai_configs_auto_reply_max_per_conversation_check
  CHECK (auto_reply_max_per_conversation = -1 OR (auto_reply_max_per_conversation >= 1 AND auto_reply_max_per_conversation <= 500));

-- Update claim_ai_reply_slot RPC to natively handle -1 (unlimited)
CREATE OR REPLACE FUNCTION public.claim_ai_reply_slot(
  conversation_id uuid,
  max_replies integer
)
RETURNS boolean AS $$
  WITH claimed AS (
    UPDATE conversations
    SET ai_reply_count = ai_reply_count + 1
    WHERE id = conversation_id
      AND (max_replies = -1 OR ai_reply_count < max_replies)
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM claimed);
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
