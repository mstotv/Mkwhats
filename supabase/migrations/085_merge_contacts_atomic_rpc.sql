-- ============================================================
-- 085_merge_contacts_atomic_rpc.sql
--
-- Atomic, transactional contact merge RPC.
--
-- Guarantees:
-- 1. Multi-tenant isolation: both contacts must belong to p_account_id.
-- 2. Self-merge rejection: p_primary_id <> p_secondary_id.
-- 3. Row-level locks (SELECT ... FOR UPDATE) on both contact rows to
--    prevent race conditions under concurrent requests.
-- 4. Merges profile fields deterministically (primary keeps non-null values;
--    secondary fills in any null/empty name, email, company, avatar_url).
-- 5. Deduplicates tags (UNIQUE (contact_id, tag_id)) via conflict-safe update.
-- 6. Deduplicates custom field values (UNIQUE (contact_id, custom_field_id)),
--    primary keeps existing values, secondary fills missing fields.
-- 7. Merges conversations safely respecting idx_conversations_account_contact:
--    - If both have conversations: re-points all child rows (messages,
--      reactions, deals, flow_runs, notifications, ai_usage_log, orders,
--      appointments) from secondary conversation to primary conversation,
--      resolves any 'collecting' order conflict, sums unread_counts,
--      re-derives last_message summary, and deletes secondary conversation.
--    - If only secondary had a conversation: updates contact_id to primary.
-- 8. Re-points all direct contact foreign keys:
--    - contact_notes (CASCADE prevention)
--    - deals (SET NULL prevention)
--    - orders (preserves contact_id and conversation_id)
--    - appointments (preserves contact_id and conversation_id)
--    - broadcast_recipients (SET NULL prevention)
--    - automation_logs & automation_pending_executions
--    - flow_runs (non-active runs preserved)
-- 9. Deletes secondary contact only after every step succeeds.
-- 10. Wraps in atomic execution: any error triggers an automatic ROLLBACK.
-- ============================================================

CREATE OR REPLACE FUNCTION public.merge_contacts(
  p_account_id UUID,
  p_primary_id UUID,
  p_secondary_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_primary_rec RECORD;
  v_secondary_rec RECORD;
  v_primary_conv UUID;
  v_secondary_conv UUID;
  v_sec_unread INTEGER := 0;
BEGIN
  -- 1. Authorization: If called from user session, verify caller is agent+
  IF auth.uid() IS NOT NULL AND NOT is_account_member(p_account_id, 'agent') THEN
    RAISE EXCEPTION 'Insufficient permissions: requires agent role or higher';
  END IF;

  -- 2. Reject self-merge
  IF p_primary_id = p_secondary_id THEN
    RAISE EXCEPTION 'Cannot merge a contact with itself';
  END IF;

  -- 3. Lock both contact rows in account for update
  SELECT * INTO v_primary_rec
  FROM contacts
  WHERE id = p_primary_id AND account_id = p_account_id
  FOR UPDATE;

  IF v_primary_rec.id IS NULL THEN
    RAISE EXCEPTION 'Primary contact not found in account';
  END IF;

  SELECT * INTO v_secondary_rec
  FROM contacts
  WHERE id = p_secondary_id AND account_id = p_account_id
  FOR UPDATE;

  IF v_secondary_rec.id IS NULL THEN
    RAISE EXCEPTION 'Secondary contact not found in account';
  END IF;

  -- 4. Merge contact profile fields (primary wins, secondary fills null/empty)
  UPDATE contacts
  SET
    name = COALESCE(NULLIF(contacts.name, ''), v_secondary_rec.name),
    email = COALESCE(NULLIF(contacts.email, ''), v_secondary_rec.email),
    company = COALESCE(NULLIF(contacts.company, ''), v_secondary_rec.company),
    avatar_url = COALESCE(NULLIF(contacts.avatar_url, ''), v_secondary_rec.avatar_url),
    updated_at = NOW()
  WHERE id = p_primary_id;

  -- 5. Safe Conversation Merge
  SELECT id INTO v_primary_conv
  FROM conversations
  WHERE account_id = p_account_id AND contact_id = p_primary_id
  LIMIT 1;

  SELECT id INTO v_secondary_conv
  FROM conversations
  WHERE account_id = p_account_id AND contact_id = p_secondary_id
  LIMIT 1;

  IF v_primary_conv IS NOT NULL AND v_secondary_conv IS NOT NULL AND v_primary_conv <> v_secondary_conv THEN
    -- If both conversations have an order in 'collecting' status, cancel the secondary one
    -- to prevent partial unique index violation on orders_one_collecting_per_conversation
    IF EXISTS (SELECT 1 FROM orders WHERE conversation_id = v_primary_conv AND status = 'collecting')
       AND EXISTS (SELECT 1 FROM orders WHERE conversation_id = v_secondary_conv AND status = 'collecting') THEN
      UPDATE orders
      SET status = 'cancelled', updated_at = NOW()
      WHERE conversation_id = v_secondary_conv AND status = 'collecting';
    END IF;

    -- Re-point conversation children from secondary to primary
    UPDATE messages SET conversation_id = v_primary_conv WHERE conversation_id = v_secondary_conv;
    UPDATE message_reactions SET conversation_id = v_primary_conv WHERE conversation_id = v_secondary_conv;
    UPDATE deals SET conversation_id = v_primary_conv WHERE conversation_id = v_secondary_conv;
    UPDATE flow_runs SET conversation_id = v_primary_conv WHERE conversation_id = v_secondary_conv;
    UPDATE notifications SET conversation_id = v_primary_conv WHERE conversation_id = v_secondary_conv;
    UPDATE ai_usage_log SET conversation_id = v_primary_conv WHERE conversation_id = v_secondary_conv;
    UPDATE orders SET conversation_id = v_primary_conv WHERE conversation_id = v_secondary_conv;
    UPDATE appointments SET conversation_id = v_primary_conv WHERE conversation_id = v_secondary_conv;

    -- Sum unread counts
    SELECT COALESCE(unread_count, 0) INTO v_sec_unread FROM conversations WHERE id = v_secondary_conv;
    UPDATE conversations
    SET unread_count = unread_count + v_sec_unread,
        updated_at = NOW()
    WHERE id = v_primary_conv;

    -- Re-derive last message summary on surviving conversation
    UPDATE conversations c
    SET last_message_text = lm.content_text,
        last_message_at   = lm.created_at,
        updated_at        = NOW()
    FROM (
      SELECT content_text, created_at
      FROM messages
      WHERE conversation_id = v_primary_conv
      ORDER BY created_at DESC
      LIMIT 1
    ) lm
    WHERE c.id = v_primary_conv;

    -- Delete the secondary conversation
    DELETE FROM conversations WHERE id = v_secondary_conv;

  ELSIF v_primary_conv IS NULL AND v_secondary_conv IS NOT NULL THEN
    -- Only secondary had a conversation: re-assign to primary
    UPDATE conversations SET contact_id = p_primary_id WHERE id = v_secondary_conv;
    v_primary_conv := v_secondary_conv;
  END IF;

  -- 6. Re-point Contact-level foreign keys
  -- Move notes
  UPDATE contact_notes SET contact_id = p_primary_id WHERE contact_id = p_secondary_id;

  -- Move deals
  UPDATE deals SET contact_id = p_primary_id WHERE contact_id = p_secondary_id;

  -- Move orders
  UPDATE orders SET contact_id = p_primary_id WHERE contact_id = p_secondary_id;

  -- Move appointments
  UPDATE appointments SET contact_id = p_primary_id WHERE contact_id = p_secondary_id;

  -- Move broadcast_recipients
  UPDATE broadcast_recipients SET contact_id = p_primary_id WHERE contact_id = p_secondary_id;

  -- Move automation logs and pending executions
  UPDATE automation_logs SET contact_id = p_primary_id WHERE contact_id = p_secondary_id;
  UPDATE automation_pending_executions SET contact_id = p_primary_id WHERE contact_id = p_secondary_id;

  -- Move flow_runs (non-active runs)
  UPDATE flow_runs SET contact_id = p_primary_id WHERE contact_id = p_secondary_id AND status <> 'active';

  -- 7. Deduplicate Tags
  UPDATE contact_tags ct
  SET contact_id = p_primary_id
  WHERE ct.contact_id = p_secondary_id
    AND NOT EXISTS (
      SELECT 1 FROM contact_tags s
      WHERE s.contact_id = p_primary_id AND s.tag_id = ct.tag_id
    );
  DELETE FROM contact_tags WHERE contact_id = p_secondary_id;

  -- 8. Deduplicate Custom Field Values
  UPDATE contact_custom_values cv
  SET contact_id = p_primary_id
  WHERE cv.contact_id = p_secondary_id
    AND NOT EXISTS (
      SELECT 1 FROM contact_custom_values s
      WHERE s.contact_id = p_primary_id AND s.custom_field_id = cv.custom_field_id
    );
  DELETE FROM contact_custom_values WHERE contact_id = p_secondary_id;

  -- 9. Finally, delete the secondary contact
  DELETE FROM contacts WHERE id = p_secondary_id AND account_id = p_account_id;

  RETURN jsonb_build_object(
    'success', true,
    'primary_id', p_primary_id,
    'secondary_id', p_secondary_id,
    'surviving_conversation_id', v_primary_conv
  );
END;
$$;

ALTER FUNCTION public.merge_contacts(UUID, UUID, UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.merge_contacts(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merge_contacts(UUID, UUID, UUID) TO authenticated, service_role;
