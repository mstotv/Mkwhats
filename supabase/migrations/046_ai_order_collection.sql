-- ============================================================
-- 046_ai_order_collection.sql — AI-assisted order collection
--
-- Enables the AI auto-reply bot to collect structured orders from
-- customers during a WhatsApp conversation (e.g. restaurant orders,
-- clothing purchases) and store them for Excel export.
--
-- Design overview
-- ───────────────
-- 1. order_form_fields   — per-account form schema; each row is one
--    field the AI must collect (name, phone, size, colour…). Defined
--    once by the account owner in Settings → AI → Order Collection.
--
-- 2. orders              — one row per order attempt per conversation.
--    A partial unique index enforces at most ONE "collecting" order per
--    conversation at a time. Starting a new order automatically
--    invalidates (cancels) any prior stale "collecting" row.
--
-- 3. order_field_values  — extracted values keyed by field_key. Written
--    by the auto-reply route after each successful JSON extraction from
--    the model's reply. Idempotent via UNIQUE(order_id, field_key) —
--    the same field can be upserted without duplication.
--
-- 4. is_order_complete() — SQL function the route calls to decide
--    whether every required field has been filled. Runs as a single
--    query; no application-level looping required.
--
-- Fallback contract (parser errors)
-- ──────────────────────────────────
-- The model embeds extracted data as |||{...}||| in its reply text.
-- If that block is absent or malformed the route logs a warning and
-- proceeds: the customer-facing reply is always sent regardless of
-- extraction success. The next inbound will try again — the missing
-- field stays unfilled and the AI will re-ask.
--
-- One active order per conversation
-- ──────────────────────────────────
-- orders_one_collecting_per_conversation (partial unique index) is
-- the authoritative gate. Before opening a new order the route issues:
--   UPDATE orders SET status='cancelled'
--   WHERE conversation_id = ? AND status = 'collecting'
-- Then inserts the new row. The index makes a concurrent duplicate
-- impossible even under parallel inbounds.
--
-- RLS
-- ───
-- All three tables are account-scoped using is_account_member() from
-- migration 017 — the canonical helper for this project. There is NO
-- account_members table; membership is tracked via profiles.account_id.
--   • SELECT: any account member (agents need to see orders in inbox)
--   • INSERT / UPDATE / DELETE: admin+ for form fields; agent+ for
--     orders and values (the auto-reply bot uses service_role and
--     bypasses RLS entirely).
--
-- Idempotent — safe to run multiple times.
-- ============================================================


-- ============================================================
-- 0. Feature flag on ai_configs
--    Master switch: order collection is off by default and only
--    activates when the account owner turns it on in Settings.
-- ============================================================
ALTER TABLE ai_configs
  ADD COLUMN IF NOT EXISTS order_collection_enabled boolean NOT NULL DEFAULT false;


-- ============================================================
-- 1. order_form_fields
--    Defines the schema of an order for this account.
--    One row per field the AI must collect.
-- ============================================================
CREATE TABLE IF NOT EXISTS order_form_fields (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid        NOT NULL REFERENCES accounts(id)   ON DELETE CASCADE,
  ai_config_id  uuid        NOT NULL REFERENCES ai_configs(id) ON DELETE CASCADE,
  -- Stable internal key used to match extracted values.
  -- Must be a simple ASCII slug (e.g. "customer_name", "phone", "size").
  field_key     text        NOT NULL,
  -- Human-readable label shown in the settings UI and injected into
  -- the system prompt so the AI knows what to call this field.
  field_label   text        NOT NULL,
  -- 'text'   — any free-form string
  -- 'number' — the AI must confirm it looks like a number before saving
  -- 'choice' — one of the values listed in `choices`
  field_type    text        NOT NULL CHECK (field_type IN ('text', 'number', 'choice')),
  -- Non-null only for field_type = 'choice'. Example: ['S','M','L','XL']
  choices       text[],
  -- When true the order is not considered complete until this field
  -- has a non-empty value.
  is_required   boolean     NOT NULL DEFAULT true,
  -- Controls the order in which the AI asks for fields (ASC).
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  -- Same field key cannot appear twice in one account's form.
  UNIQUE (ai_config_id, field_key)
);

CREATE INDEX IF NOT EXISTS order_form_fields_account_id_idx
  ON order_form_fields (account_id);

CREATE INDEX IF NOT EXISTS order_form_fields_ai_config_id_idx
  ON order_form_fields (ai_config_id);

ALTER TABLE order_form_fields ENABLE ROW LEVEL SECURITY;

-- Any account member can read the form definition (agents need it
-- to display the expected fields in the inbox order panel).
DROP POLICY IF EXISTS order_form_fields_select ON order_form_fields;
CREATE POLICY order_form_fields_select ON order_form_fields FOR SELECT
  USING (is_account_member(account_id));

-- Only admin+ may create / change / remove the form definition.
DROP POLICY IF EXISTS order_form_fields_insert ON order_form_fields;
CREATE POLICY order_form_fields_insert ON order_form_fields FOR INSERT
  WITH CHECK (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS order_form_fields_update ON order_form_fields;
CREATE POLICY order_form_fields_update ON order_form_fields FOR UPDATE
  USING (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS order_form_fields_delete ON order_form_fields;
CREATE POLICY order_form_fields_delete ON order_form_fields FOR DELETE
  USING (is_account_member(account_id, 'admin'));

-- Keep updated_at current.
CREATE OR REPLACE FUNCTION public.update_order_form_fields_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_form_fields_updated_at ON order_form_fields;
CREATE TRIGGER order_form_fields_updated_at
  BEFORE UPDATE ON order_form_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_order_form_fields_updated_at();


-- ============================================================
-- 2. orders
--    One row per order attempt per conversation.
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid        NOT NULL REFERENCES accounts(id)       ON DELETE CASCADE,
  conversation_id uuid        NOT NULL REFERENCES conversations(id)  ON DELETE CASCADE,
  -- Denormalized for quick inbox display; nullable because the contact
  -- record may be deleted independently.
  contact_id      uuid        REFERENCES contacts(id) ON DELETE SET NULL,
  -- Life-cycle:
  --   collecting → confirmed → exported
  --   collecting → cancelled  (user abandoned or started a new order)
  status          text        NOT NULL DEFAULT 'collecting'
                              CHECK (status IN ('collecting', 'confirmed', 'exported', 'cancelled')),
  -- Set when the customer sends a confirmation keyword.
  confirmed_at    timestamptz,
  -- Set when an account member exports this order to Excel.
  exported_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_account_id_idx
  ON orders (account_id);

CREATE INDEX IF NOT EXISTS orders_conversation_id_idx
  ON orders (conversation_id);

CREATE INDEX IF NOT EXISTS orders_status_idx
  ON orders (account_id, status);

-- ── CORE CONSTRAINT ─────────────────────────────────────────
-- At most ONE order in status='collecting' per conversation.
-- A partial index is the most efficient way to enforce this:
-- it only indexes rows that could conflict, so completed /
-- cancelled orders are invisible to it and don't block history.
-- The application MUST cancel the prior 'collecting' row before
-- inserting a new one; this index makes a concurrent duplicate
-- impossible even under parallel inbounds.
CREATE UNIQUE INDEX IF NOT EXISTS orders_one_collecting_per_conversation
  ON orders (conversation_id)
  WHERE status = 'collecting';

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Agents and above may read orders in the inbox order panel.
DROP POLICY IF EXISTS orders_select ON orders;
CREATE POLICY orders_select ON orders FOR SELECT
  USING (is_account_member(account_id));

-- Agents (and admins) can create and update orders from the inbox.
-- The auto-reply bot writes through service_role and bypasses RLS.
DROP POLICY IF EXISTS orders_insert ON orders;
CREATE POLICY orders_insert ON orders FOR INSERT
  WITH CHECK (is_account_member(account_id, 'agent'));

DROP POLICY IF EXISTS orders_update ON orders;
CREATE POLICY orders_update ON orders FOR UPDATE
  USING (is_account_member(account_id, 'agent'));

DROP POLICY IF EXISTS orders_delete ON orders;
CREATE POLICY orders_delete ON orders FOR DELETE
  USING (is_account_member(account_id, 'admin'));

CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.update_orders_updated_at();


-- ============================================================
-- 3. order_field_values
--    Extracted field values for each order.
--    Written after each successful JSON extraction from the model.
-- ============================================================
CREATE TABLE IF NOT EXISTS order_field_values (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  -- Denormalized for RLS without an extra join.
  account_id   uuid        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  -- Matches order_form_fields.field_key for this account.
  field_key    text        NOT NULL,
  -- The extracted value as a string. Numbers and choices are stored as
  -- text and coerced by the application layer on export if needed.
  -- NULL means the field was explicitly cleared; an empty string is
  -- treated the same as NULL by is_order_complete().
  field_value  text,
  -- Timestamp of the last update to this field (useful for audit trail).
  collected_at timestamptz NOT NULL DEFAULT now(),
  -- One value per field per order. The route upserts on this key so
  -- repeated extraction of the same field overwrites cleanly.
  UNIQUE (order_id, field_key)
);

CREATE INDEX IF NOT EXISTS order_field_values_order_id_idx
  ON order_field_values (order_id);

CREATE INDEX IF NOT EXISTS order_field_values_account_id_idx
  ON order_field_values (account_id);

ALTER TABLE order_field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_field_values_select ON order_field_values;
CREATE POLICY order_field_values_select ON order_field_values FOR SELECT
  USING (is_account_member(account_id));

DROP POLICY IF EXISTS order_field_values_insert ON order_field_values;
CREATE POLICY order_field_values_insert ON order_field_values FOR INSERT
  WITH CHECK (is_account_member(account_id, 'agent'));

DROP POLICY IF EXISTS order_field_values_update ON order_field_values;
CREATE POLICY order_field_values_update ON order_field_values FOR UPDATE
  USING (is_account_member(account_id, 'agent'));

DROP POLICY IF EXISTS order_field_values_delete ON order_field_values;
CREATE POLICY order_field_values_delete ON order_field_values FOR DELETE
  USING (is_account_member(account_id, 'agent'));


-- ============================================================
-- 4. is_order_complete(p_order_id)
--
-- Returns true when every required field in the account's form has a
-- non-empty value in order_field_values for this order. The route
-- calls this after each successful extraction instead of looping over
-- fields in application code.
--
-- Logic: "complete" means there is NO required field that lacks a
-- non-empty value → NOT EXISTS (missing required fields).
--
-- SECURITY DEFINER so the service-role bot can call it. The function
-- is hard-scoped to the single order_id passed in and joins through
-- `orders` to reach the account's form fields, so no cross-account
-- data is reachable.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_order_complete(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM orders o
    JOIN order_form_fields f
      ON  f.account_id = o.account_id
    LEFT JOIN order_field_values v
      ON  v.order_id  = o.id
      AND v.field_key = f.field_key
    WHERE o.id          = p_order_id
      AND f.is_required = true
      AND (
            v.field_value IS NULL
         OR trim(v.field_value) = ''
          )
  );
$$;

-- The auto-reply bot calls this under service_role (no auth.uid()).
REVOKE ALL ON FUNCTION public.is_order_complete(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_order_complete(uuid) TO authenticated, service_role;


-- ============================================================
-- 5. get_order_missing_fields(p_order_id)
--
-- Returns the list of required fields that are still missing, ordered
-- by sort_order. The route injects this into the system prompt so the
-- AI always knows exactly what to ask for next — no hallucination about
-- already-collected fields.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_order_missing_fields(p_order_id uuid)
RETURNS TABLE (
  field_key   text,
  field_label text,
  field_type  text,
  choices     text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.field_key,
    f.field_label,
    f.field_type,
    f.choices
  FROM orders o
  JOIN order_form_fields f
    ON  f.account_id = o.account_id
  LEFT JOIN order_field_values v
    ON  v.order_id  = o.id
    AND v.field_key = f.field_key
  WHERE o.id          = p_order_id
    AND f.is_required = true
    AND (
          v.field_value IS NULL
       OR trim(v.field_value) = ''
        )
  ORDER BY f.sort_order ASC;
$$;

REVOKE ALL ON FUNCTION public.get_order_missing_fields(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_missing_fields(uuid) TO authenticated, service_role;


-- ============================================================
-- 6. cancel_stale_collecting_order(p_conversation_id)
--
-- Called by the route immediately before opening a new order to
-- honour the "one collecting order per conversation" rule. Safe to
-- call even when no stale order exists (0 rows updated = no-op).
-- Returns the id of the cancelled order (NULL if none existed).
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_stale_collecting_order(
  p_conversation_id uuid
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE orders
  SET    status     = 'cancelled',
         updated_at = now()
  WHERE  conversation_id = p_conversation_id
    AND  status           = 'collecting'
  RETURNING id;
$$;

REVOKE ALL ON FUNCTION public.cancel_stale_collecting_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_stale_collecting_order(uuid) TO service_role;
