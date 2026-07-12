-- ============================================================
-- The 2AM Club - Local Seed Data
-- ============================================================

DO $$
DECLARE
  v_org_id uuid;
  v_store_id uuid;
  v_super_admin_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Insert dummy user (must exist in auth.users ideally, but we bypass auth in local dev with service role)
  -- Or rely on Supabase local dev inserting the user via UI, but for pure seed we just insert into profiles directly
  -- (Normally this breaks FK to auth.users if auth.users is empty, so we must insert auth.users first)
  
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
  VALUES (
    v_super_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@the2amclub.com',
    '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12', -- dummy hash
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Super Admin"}',
    false,
    now(),
    now()
  ) ON CONFLICT DO NOTHING;

  -- The trigger will auto-create the profile. We just update it to SUPER_ADMIN.
  UPDATE public.profiles SET role = 'SUPER_ADMIN' WHERE id = v_super_admin_id;

  -- 1. Create Organization
  INSERT INTO organizations (slug, name, theme_color)
  VALUES ('thapar', 'Thapar University', '#FF5733')
  RETURNING id INTO v_org_id;

  -- 2. Create Store
  INSERT INTO stores (organization_id, slug, name, pickup_address, shop_open)
  VALUES (v_org_id, 'hostel-j', 'Hostel J Canteen', 'Ground Floor, Hostel J', true)
  RETURNING id INTO v_store_id;

  -- 3. Link Super Admin to Store
  INSERT INTO store_members (store_id, profile_id, role)
  VALUES (v_store_id, v_super_admin_id, 'SUPER_ADMIN');

  -- 4. Insert Products
  INSERT INTO products (organization_id, store_id, name, category, price, stock, is_active)
  VALUES 
    (v_org_id, v_store_id, 'Maggi', 'Noodles', 40.00, 50, true),
    (v_org_id, v_store_id, 'Cold Coffee', 'Beverages', 60.00, 30, true),
    (v_org_id, v_store_id, 'Cheese Grilled Sandwich', 'Snacks', 80.00, 20, true);

  -- Ensure storage bucket exists
  INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Seed data inserted successfully';
END $$;
