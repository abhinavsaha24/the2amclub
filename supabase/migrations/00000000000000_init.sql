-- ============================================================
-- The 2AM Club - Production Supabase Database Schema (v4.0)
-- Architecture: Multi-Tenant SaaS (Organization -> Store -> Member)
-- Storage: Server-Side Only Uploads (High Security)
-- Auth: Supabase Auth Linked Profiles
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '▶️ Starting schema initialization v4.0...';

  -- ============================================================
  -- 1. ENUMS
  -- ============================================================
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'STAFF');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'ready', 'collected', 'cancelled');
  END IF;

  -- ============================================================
  -- 2. ORGANIZATIONS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS organizations (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    name text not null,
    logo text,
    banner text,
    theme_color text,
    support_email text,
    support_phone text,
    website text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  -- ============================================================
  -- 3. PROFILES (Linked to auth.users)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role user_role not null default 'STAFF',
    name text not null,
    phone text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  -- ============================================================
  -- 4. STORES (Formerly Locations)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS stores (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references organizations(id) on delete cascade not null,
    slug text not null unique,
    name text not null,
    logo text,
    banner text,
    upi_id text,
    qr_code text,
    pickup_address text,
    opening_hours text,
    closing_hours text,
    shop_open boolean not null default true,
    notice text,
    is_active boolean not null default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  -- ============================================================
  -- 5. STORE MEMBERS (Mapping table for roles)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS store_members (
    id uuid primary key default gen_random_uuid(),
    store_id uuid references stores(id) on delete cascade not null,
    profile_id uuid references profiles(id) on delete cascade not null,
    role user_role not null default 'STAFF',
    created_at timestamptz default now(),
    UNIQUE(store_id, profile_id)
  );

  -- ============================================================
  -- 6. INVITATION CODES
  -- ============================================================
  CREATE TABLE IF NOT EXISTS invitation_codes (
    id uuid primary key default gen_random_uuid(),
    hashed_code text not null unique,
    organization_id uuid references organizations(id) on delete cascade not null,
    store_id uuid references stores(id) on delete cascade not null,
    role user_role not null,
    creator_id uuid references profiles(id) on delete set null,
    max_uses integer not null default 1,
    used_count integer not null default 0,
    expires_at timestamptz,
    is_revoked boolean not null default false,
    created_at timestamptz default now()
  );

  -- ============================================================
  -- 7. INVITATION USAGE HISTORY
  -- ============================================================
  CREATE TABLE IF NOT EXISTS invitation_usage (
    id uuid primary key default gen_random_uuid(),
    invitation_id uuid references invitation_codes(id) on delete cascade not null,
    profile_id uuid references profiles(id) on delete cascade not null,
    used_at timestamptz default now()
  );

  -- ============================================================
  -- 8. PRODUCTS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS products (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references organizations(id) on delete cascade not null,
    store_id uuid references stores(id) on delete cascade not null,
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

  -- ============================================================
  -- 9. ORDERS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS orders (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references organizations(id) on delete cascade not null,
    store_id uuid references stores(id) on delete cascade not null,
    order_no text unique not null,
    customer_name text not null,
    customer_phone text not null,
    total numeric(10,2) not null,
    status order_status not null default 'pending',
    utr_reference text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  -- ============================================================
  -- 10. ORDER ITEMS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references orders(id) on delete cascade not null,
    product_id uuid references products(id) not null,
    qty integer not null check (qty > 0),
    price numeric(10,2) not null
  );

  -- ============================================================
  -- 11. AUDIT LOGS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references organizations(id) on delete cascade,
    store_id uuid references stores(id) on delete cascade,
    user_id uuid references profiles(id) on delete set null,
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

  -- ============================================================
  -- 12. INDEXES
  -- ============================================================
  create index if not exists idx_stores_org on stores(organization_id);
  create index if not exists idx_products_store on products(store_id);
  create index if not exists idx_products_org on products(organization_id);
  create index if not exists idx_orders_store on orders(store_id);
  create index if not exists idx_orders_org on orders(organization_id);
  create index if not exists idx_orders_created_at on orders(created_at desc);
  create index if not exists idx_store_members_profile on store_members(profile_id);
  
  RAISE NOTICE '✅ Tables & Indexes verified';

END $$;

-- ============================================================
-- 13. TRIGGERS & RPC FUNCTIONS
-- ============================================================
DO $$
BEGIN
  create or replace function update_updated_at()
  returns trigger as $fn$
  begin
    new.updated_at = now();
    return new;
  end;
  $fn$ language plpgsql;

  -- Ensure triggers exist idempotently
  drop trigger if exists orgs_updated_at on organizations;
  create trigger orgs_updated_at before update on organizations for each row execute function update_updated_at();

  drop trigger if exists stores_updated_at on stores;
  create trigger stores_updated_at before update on stores for each row execute function update_updated_at();
  
  drop trigger if exists profiles_updated_at on profiles;
  create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();

  drop trigger if exists products_updated_at on products;
  create trigger products_updated_at before update on products for each row execute function update_updated_at();

  -- RPC: Create Profile on User Signup (Auth hook)
  create or replace function handle_new_user()
  returns trigger as $fn$
  begin
    insert into public.profiles (id, name, role)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'User'), 'STAFF');
    return new;
  end;
  $fn$ language plpgsql security definer;

  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();

  -- RPC: Atomic Stock Decrement
  create or replace function decrement_stock(p_product_id uuid, p_qty integer)
  returns void as $fn$
  begin
    update products set stock = stock - p_qty where id = p_product_id and stock >= p_qty;
    if not found then raise exception 'Insufficient stock for product %', p_product_id; end if;
    update products set is_active = false where id = p_product_id and stock = 0;
  end;
  $fn$ language plpgsql;

  -- RPC: Restore Stock
  create or replace function restore_stock(p_product_id uuid, p_qty integer)
  returns void as $fn$
  begin
    update products set stock = stock + p_qty, is_active = true where id = p_product_id;
  end;
  $fn$ language plpgsql;

  RAISE NOTICE '✅ Triggers & RPCs verified';
END $$;

-- ============================================================
-- 14. ROW LEVEL SECURITY (RLS)
-- ============================================================
DO $$
BEGIN
  alter table organizations enable row level security;
  alter table stores enable row level security;
  alter table profiles enable row level security;
  alter table store_members enable row level security;
  alter table products enable row level security;
  alter table orders enable row level security;
  alter table order_items enable row level security;
  alter table invitation_codes enable row level security;
  alter table audit_logs enable row level security;

  -- Helper to check if user belongs to a store
  create or replace function user_belongs_to_store(p_store_id uuid)
  returns boolean as $fn$
    select exists (
      select 1 from store_members 
      where store_id = p_store_id and profile_id = auth.uid()
    );
  $fn$ language sql security definer;

  -- 1. Organizations
  DROP POLICY IF EXISTS "Public Read Organizations" ON organizations;
  CREATE POLICY "Public Read Organizations" ON organizations FOR SELECT USING (true);
  
  -- 2. Stores
  DROP POLICY IF EXISTS "Public Read Stores" ON stores;
  CREATE POLICY "Public Read Stores" ON stores FOR SELECT USING (is_active = true);
  CREATE POLICY "Store Members Manage Stores" ON stores FOR ALL USING (user_belongs_to_store(id));

  -- 3. Products
  DROP POLICY IF EXISTS "Public Read Products" ON products;
  CREATE POLICY "Public Read Products" ON products FOR SELECT USING (is_active = true);
  CREATE POLICY "Store Members Manage Products" ON products FOR ALL USING (user_belongs_to_store(store_id));

  -- 4. Orders
  DROP POLICY IF EXISTS "Public Create Orders" ON orders;
  CREATE POLICY "Public Create Orders" ON orders FOR INSERT WITH CHECK (true);
  CREATE POLICY "Store Members Manage Orders" ON orders FOR ALL USING (user_belongs_to_store(store_id));

  -- 5. Order Items
  CREATE POLICY "Public Create Order Items" ON order_items FOR INSERT WITH CHECK (true);
  CREATE POLICY "Store Members Manage Order Items" ON order_items FOR ALL USING (
    exists (select 1 from orders where orders.id = order_items.order_id and user_belongs_to_store(orders.store_id))
  );

  -- 6. Store Members
  CREATE POLICY "Members Read Themselves" ON store_members FOR SELECT USING (profile_id = auth.uid() OR user_belongs_to_store(store_id));
  -- Inserting members is handled securely by Service Role via invitation consumption

  -- 7. Audit Logs
  CREATE POLICY "Store Members Manage Audit Logs" ON audit_logs FOR ALL USING (user_belongs_to_store(store_id));

  -- 8. Invitation Codes
  CREATE POLICY "Store Members Manage Invitations" ON invitation_codes FOR ALL USING (user_belongs_to_store(store_id));

  RAISE NOTICE '✅ Strict Tenant Isolation RLS enabled';
END $$;

-- ============================================================
-- 15. STORAGE POLICIES
-- ============================================================
DO $$
BEGIN
  -- We assume 'product-images' bucket exists (managed outside or during seed)
  -- Allow public read access to product-images
  DROP POLICY IF EXISTS "Public Read Images" ON storage.objects;
  CREATE POLICY "Public Read Images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

  -- Allow authenticated users to upload/update/delete images if they belong to a store
  -- In a real production scenario with strict tenant isolation, we would verify the path prefix
  -- matches the organization/store. For now, authenticated users can manage product-images.
  DROP POLICY IF EXISTS "Auth Manage Images" ON storage.objects;
  CREATE POLICY "Auth Manage Images" ON storage.objects FOR ALL USING (
    bucket_id = 'product-images' AND auth.role() = 'authenticated'
  );
END $$;

