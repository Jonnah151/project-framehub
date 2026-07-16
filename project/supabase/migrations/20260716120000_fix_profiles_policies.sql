-- Migration: Fix recursive RLS policies on profiles
-- Replaces policies that indirectly referenced `profiles` within their own
-- USING/WITH CHECK expressions (via helper functions), which can cause
-- "infinite recursion detected in policy for relation 'profiles'".

-- DROP and recreate safe, non-recursive policies as requested.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: only allow owners to read their row
DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (id = auth.uid());

-- INSERT: only allow insert where id matches auth.uid()
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

-- UPDATE: owner-only update
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- DELETE: owner-only delete
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE
  TO authenticated USING (id = auth.uid());

-- Note: this migration replaces policies that referenced helper functions
-- (e.g. is_staff_user(), is_admin_user()) which performed SELECTs on the
-- `profiles` table inside policy expressions. Those indirect references
-- can trigger recursive policy evaluation at runtime. The safe replacements
-- only rely on `auth.uid()` and do not query `profiles` from within policies.
