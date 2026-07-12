-- ============================================================
-- The 2AM Club - Production Supabase Database Schema (v3.1)
-- Architecture: Multi-Tenant Location-Scoped Model
-- Storage: Server-Side Only Uploads (High Security)
-- ============================================================

-- ============================================================
-- PHASE 1: Idempotent Table & Schema Cleanup (Optional/Dev)
-- Uncomment these if you need to wipe the DB and start fresh.
-- ============================================================
-- drop table if exists order_items cascade;
-- drop table if exists orders cascade;
-- drop table if exists products cascade;
-- drop table if exists locations cascade;


-- ============================================================
-- PHASE 2: Table Creation (Idempotent)
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '▶️ Starting schema initialization...';

  -- Locations Table
  CREATE TABLE IF NOT EXISTS locations (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    admin_code text not null unique,
    upi_id text,
    upi_qr_image text,
    pickup_address text,
    shop_open boolean not null default true,
    notice text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
  RAISE NOTICE '✅ Table verified: locations';

  -- Products Table
  CREATE TABLE IF NOT EXISTS products (
    id uuid primary key default gen_random_uuid(),
    location_id uuid references locations(id) on delete cascade not null,
    name text not null,
    category text not null,
    description text,
    price numeric(10,2) not null,
    image text,
    stock integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
  RAISE NOTICE '✅ Table verified: products';

  -- Orders Table
  CREATE TABLE IF NOT EXISTS orders (
    id uuid primary key default gen_random_uuid(),
    location_id uuid references locations(id) on delete cascade not null,
    order_no text unique not null,
    customer_name text not null,
    customer_phone text not null,
    total numeric(10,2) not null,
    status text not null default 'pending' check (status in ('pending','confirmed','ready','collected','cancelled')),
    utr_reference text,
    created_at timestamptz default now()
  );
  RAISE NOTICE '✅ Table verified: orders';

  -- Order Items Table
  CREATE TABLE IF NOT EXISTS order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references orders(id) on delete cascade not null,
    product_id uuid references products(id) not null,
    qty integer not null check (qty > 0),
    price numeric(10,2) not null
  );
  RAISE NOTICE '✅ Table verified: order_items';

  -- Audit Logs Table
  CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid primary key default gen_random_uuid(),
    admin_id text,
    location_id uuid references locations(id) on delete set null,
    action text not null,
    resource text not null,
    resource_id text,
    before_value jsonb,
    after_value jsonb,
    ip_address text,
    user_agent text,
    success boolean not null default true,
    failure_reason text,
    created_at timestamptz default now()
  );
  RAISE NOTICE '✅ Table verified: audit_logs';

END $$;

-- ============================================================
-- PHASE 3: Indexes
-- ============================================================
DO $$
BEGIN
  create index if not exists idx_locations_admin on locations(admin_code);
  create index if not exists idx_products_location on products(location_id);
  create index if not exists idx_orders_location on orders(location_id);
  create index if not exists idx_products_category on products(category);
  create index if not exists idx_orders_created_at on orders(created_at desc);
  RAISE NOTICE '✅ Indexes verified';
END $$;

-- ============================================================
-- PHASE 4: Row Level Security (RLS)
-- Because authentication uses custom 'admin_code' via cookies,
-- standard Supabase Auth is bypassed. Therefore, RLS is disabled
-- on these specific tables. Security is enforced via Next.js APIs.
-- ============================================================
DO $$
BEGIN
  alter table locations disable row level security;
  alter table products disable row level security;
  alter table orders disable row level security;
  alter table order_items disable row level security;
  RAISE NOTICE '✅ RLS configured (disabled for custom auth architecture)';
END $$;

-- ============================================================
-- PHASE 5: Triggers and RPC Functions
-- ============================================================
DO $$
BEGIN
  -- Updated_at Trigger Function
  create or replace function update_updated_at()
  returns trigger as $fn$
  begin
    new.updated_at = now();
    return new;
  end;
  $fn$ language plpgsql;

  -- Apply triggers idempotently
  drop trigger if exists products_updated_at on products;
  create trigger products_updated_at
    before update on products
    for each row execute function update_updated_at();

  drop trigger if exists locations_updated_at on locations;
  create trigger locations_updated_at
    before update on locations
    for each row execute function update_updated_at();
  
  RAISE NOTICE '✅ Triggers verified';

  -- Atomic Stock Decrement RPC
  create or replace function decrement_stock(p_product_id uuid, p_qty integer)
  returns void as $fn$
  begin
    update products
    set stock = stock - p_qty
    where id = p_product_id and stock >= p_qty;
    
    if not found then
      raise exception 'Insufficient stock for product %', p_product_id;
    end if;
    
    -- Auto-deactivate if zero stock
    update products set is_active = false where id = p_product_id and stock = 0;
  end;
  $fn$ language plpgsql;

  -- Restore Stock RPC
  create or replace function restore_stock(p_product_id uuid, p_qty integer)
  returns void as $fn$
  begin
    update products
    set stock = stock + p_qty,
        is_active = true
    where id = p_product_id;
  end;
  $fn$ language plpgsql;

  RAISE NOTICE '✅ RPC functions verified';
END $$;

-- ============================================================
-- PHASE 6: Storage Architecture (Production Secured)
-- Requirement: Server-Side Uploads ONLY using Service Role Key.
-- Action: The bucket is fully locked down. Anonymous public can ONLY read.
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '▶️ Initializing Storage Architecture...';

  -- 1. Verify Storage extension is enabled (Supabase default)
  IF NOT EXISTS (SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    RAISE EXCEPTION '❌ [ERROR] Supabase Storage schema not found!';
  END IF;

  -- 2. Create the public bucket idempontently
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images') THEN
    RAISE NOTICE '✅ Bucket "product-images" is ready.';
  ELSE
    RAISE EXCEPTION '❌ [ERROR] Failed to verify bucket creation.';
  END IF;

  -- 3. Secure Storage Policies
  -- We drop any existing policies to prevent duplicates and ensure clean state
  DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
  DROP POLICY IF EXISTS "Allow Uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Allow Updates" ON storage.objects;
  DROP POLICY IF EXISTS "Allow Deletes" ON storage.objects;
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;

  -- Create single Read-Only policy for the public
  CREATE POLICY "Public Read Access"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'product-images' );

  -- NOTE: We explicitly DO NOT create INSERT/UPDATE/DELETE policies.
  -- Uploads will be handled via the Next.js API using SUPABASE_SERVICE_ROLE_KEY,
  -- which inherently bypasses RLS securely on the backend.

  RAISE NOTICE '✅ Storage Policies secured (Read-Only applied).';
END $$;


-- ============================================================
-- PHASE 7: Seed Data (Optional)
-- ============================================================
DO $$
DECLARE
  loc1_id uuid := gen_random_uuid();
  loc2_id uuid := gen_random_uuid();
BEGIN
  -- Insert only if locations table is empty (preventing duplicate seeds on multiple runs)
  IF NOT EXISTS (SELECT 1 FROM locations LIMIT 1) THEN
    -- Insert Locations
    insert into locations (id, name, admin_code, shop_open, pickup_address) values
      (loc1_id, 'Block A Canteen', 'BLOCK-A-ADMIN', true, 'Block A, Ground Floor Counter'),
      (loc2_id, 'Library Cafe', 'LIB-CAFE-ADMIN', true, 'Central Library, 1st Floor Cafe');

    -- Insert Products for Block A
    insert into products (location_id, name, category, price, stock, is_active) values
      (loc1_id, 'Maggi Masala', 'Noodles', 30.00, 50, true),
      (loc1_id, 'Veg Sandwich', 'Sandwiches', 50.00, 25, true),
      (loc1_id, 'Masala Tea', 'Beverages', 15.00, 100, true);

    -- Insert Products for Library
    insert into products (location_id, name, category, price, stock, is_active) values
      (loc2_id, 'Cold Coffee', 'Beverages', 40.00, 50, true),
      (loc2_id, 'Grilled Sandwich', 'Sandwiches', 60.00, 30, true),
      (loc2_id, 'Cup Noodles', 'Noodles', 25.00, 40, true);
      
    RAISE NOTICE '✅ Seed data inserted';
  ELSE
    RAISE NOTICE '⏭️ Seed data skipped (tables already contain data)';
  END IF;
END $$;

-- ============================================================
-- FINAL VERIFICATION
-- Run this query manually to verify database state
-- ============================================================
/*
SELECT 
  'Tables' as component, (SELECT count(*)::text FROM information_schema.tables WHERE table_schema = 'public') as count
UNION ALL
SELECT 
  'Indexes' as component, (SELECT count(*)::text FROM pg_indexes WHERE schemaname = 'public') as count
UNION ALL
SELECT 
  'Storage Buckets' as component, (SELECT count(*)::text FROM storage.buckets) as count
UNION ALL
SELECT 
  'Storage Policies' as component, (SELECT count(*)::text FROM pg_policies WHERE schemaname = 'storage') as count;
*/
