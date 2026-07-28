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
<!-- END:multi-tenant-rules -->
