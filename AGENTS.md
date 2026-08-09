<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:multi-tenant-rules -->
# Multi-Tenant Architecture Rules

This project is **multi-tenant**. Every table that holds account-specific data MUST follow these rules — no exceptions:

1. **`account_id` is mandatory**: Every new table with per-account data must have an `account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE` column.

2. **RLS policy is mandatory**: Every such table must have Row Level Security enabled and a policy that filters by `account_id`. The canonical pattern is:
   ```sql
   ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "Account members can manage <table>" ON <table>;
   CREATE POLICY "Account members can manage <table>" ON <table>
     FOR ALL USING (
       account_id IN (
         SELECT account_id FROM account_members WHERE user_id = auth.uid()
       )
     );
   ```

3. **Never edit old migrations**: Any schema change must be in a **new migration file** with the next sequential number (e.g. if the last is `036_...sql`, the new one is `037_...sql`). Never modify existing migration files.

4. **Migrations are idempotent**: Use `IF NOT EXISTS`, `DROP ... IF EXISTS`, `CREATE OR REPLACE`, and DO blocks for constraint checks so migrations are safe to run multiple times.

5. **No `account_members` table**: This project does NOT have an `account_members` table. Membership is tracked via `profiles.account_id`. For every new RLS policy, always use the `is_account_member(account_id)` helper function (migration 017) — never invent a substitute membership join. Pattern:
   ```sql
   -- Read: any member
   CREATE POLICY my_table_select ON my_table FOR SELECT
     USING (is_account_member(account_id));
   -- Write: agent+
   CREATE POLICY my_table_insert ON my_table FOR INSERT
     WITH CHECK (is_account_member(account_id, 'agent'));
   -- Settings-class: admin+
   CREATE POLICY my_table_update ON my_table FOR UPDATE
     USING (is_account_member(account_id, 'admin'));
   ```
<!-- END:multi-tenant-rules -->
