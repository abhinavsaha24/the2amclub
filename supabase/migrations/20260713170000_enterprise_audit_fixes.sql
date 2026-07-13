-- ============================================================
-- The 2AM Club - Enterprise Production Fixes
-- ============================================================
-- Fixes SQLSTATE 42501 (Missing base privileges)
-- Removes legacy anonymous write policies
-- Implements robust Super Admin and Store Admin isolation
-- Fixes RLS infinite recursion
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '▶️ Applying Enterprise Audit Fixes...';

  -- 1. FIX BASE PRIVILEGES (Solves 42501 permission denied)
  -- By default, anon and authenticated roles must have USAGE and SELECT. 
  -- We grant ALL so RLS fully governs what they can do.
  GRANT USAGE ON SCHEMA public TO anon, authenticated;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
  GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
END $$;

-- 2. CREATE HELPER FUNCTIONS (Non-Recursive)
-- These functions are SECURITY DEFINER and bypass RLS to prevent infinite loops.

-- Helper: Check if user is Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
$fn$;

-- Helper: Check if user belongs to a specific store
CREATE OR REPLACE FUNCTION is_store_member(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM store_members 
    WHERE store_id = p_store_id AND profile_id = auth.uid()
  );
$fn$;

DO $$
BEGIN
  -- 3. DROP ALL EXISTING POLICIES TO AVOID DUPLICATES
  DROP POLICY IF EXISTS "Public Read Organizations" ON organizations;
  DROP POLICY IF EXISTS "Public Read Stores" ON stores;
  DROP POLICY IF EXISTS "Store Members Manage Stores" ON stores;
  DROP POLICY IF EXISTS "Public Read Products" ON products;
  DROP POLICY IF EXISTS "Store Members Manage Products" ON products;
  DROP POLICY IF EXISTS "Public Create Orders" ON orders;
  DROP POLICY IF EXISTS "Store Members Manage Orders" ON orders;
  DROP POLICY IF EXISTS "Public Create Order Items" ON order_items;
  DROP POLICY IF EXISTS "Store Members Manage Order Items" ON order_items;
  DROP POLICY IF EXISTS "Users Read Own Profile" ON profiles;
  DROP POLICY IF EXISTS "Members Read Themselves" ON store_members;
  DROP POLICY IF EXISTS "Store Members Manage Audit Logs" ON audit_logs;
  DROP POLICY IF EXISTS "Store Members Manage Invitations" ON invitation_codes;

  -- 4. APPLY NEW ISOLATED POLICIES

  -- Organizations
  CREATE POLICY "Public Read Organizations" ON organizations FOR SELECT USING (true);
  CREATE POLICY "Super Admin Manage Organizations" ON organizations FOR ALL TO authenticated USING (is_super_admin());

  -- Stores
  CREATE POLICY "Public Read Stores" ON stores FOR SELECT USING (is_active = true);
  CREATE POLICY "Store Admin Manage Stores" ON stores FOR ALL TO authenticated USING (is_store_member(id) OR is_super_admin());

  -- Products
  CREATE POLICY "Public Read Products" ON products FOR SELECT USING (is_active = true);
  CREATE POLICY "Store Admin Manage Products" ON products FOR ALL TO authenticated USING (is_store_member(store_id) OR is_super_admin());

  -- Profiles
  CREATE POLICY "Users Read Own Profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
  CREATE POLICY "Super Admin Read Profiles" ON profiles FOR SELECT TO authenticated USING (is_super_admin());

  -- Store Members
  CREATE POLICY "Store Members Read" ON store_members FOR SELECT TO authenticated USING (
    profile_id = auth.uid() OR is_store_member(store_id) OR is_super_admin()
  );
  CREATE POLICY "Super Admin Manage Members" ON store_members FOR ALL TO authenticated USING (is_super_admin());

  -- Orders (No anonymous writes - managed by Service Role API)
  CREATE POLICY "Store Admin Manage Orders" ON orders FOR ALL TO authenticated USING (is_store_member(store_id) OR is_super_admin());

  -- Order Items
  CREATE POLICY "Store Admin Manage Order Items" ON order_items FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (is_store_member(orders.store_id) OR is_super_admin())
    )
  );

  -- Audit Logs
  CREATE POLICY "Store Admin Read Audit Logs" ON audit_logs FOR SELECT TO authenticated USING (is_store_member(store_id) OR is_super_admin());

  -- Invitations
  CREATE POLICY "Store Admin Manage Invitations" ON invitation_codes FOR ALL TO authenticated USING (is_store_member(store_id) OR is_super_admin());
  CREATE POLICY "Store Admin Read Usage" ON invitation_usage FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM invitation_codes 
      WHERE invitation_codes.id = invitation_usage.invitation_id 
      AND (is_store_member(invitation_codes.store_id) OR is_super_admin())
    )
  );

  RAISE NOTICE '✅ Enterprise Audit Fixes applied successfully.';
END $$;
