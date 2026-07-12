-- ============================================================
-- The 2AM Club - Supabase Database Schema (v3 — Multi-Admin / Locations)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Drop old tables if they exist to start fresh (WARNING: Data loss!)
-- ONLY RUN THIS IF YOU ARE OKAY WITH WIPING THE DB FOR THE REWRITE
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists products cascade;
drop table if exists settings cascade;
drop table if exists locations cascade;

-- ============================================================
-- Locations Table (Replaces global settings and adds multi-tenant)
-- ============================================================
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- e.g. "Hostel Block A"
  admin_code text not null unique, -- e.g. "BLOCKA-123" for login
  upi_id text,
  upi_qr_image text,
  pickup_address text,
  shop_open boolean not null default true,
  notice text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Products Table (Scoped to Location)
-- ============================================================
create table if not exists products (
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

-- ============================================================
-- Orders Table (Scoped to Location)
-- ============================================================
create table if not exists orders (
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

-- ============================================================
-- Order Items Table
-- ============================================================
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) not null,
  qty integer not null check (qty > 0),
  price numeric(10,2) not null
);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_locations_admin on locations(admin_code);
create index if not exists idx_products_location on products(location_id);
create index if not exists idx_orders_location on orders(location_id);
create index if not exists idx_products_category on products(category);
create index if not exists idx_orders_created_at on orders(created_at desc);

-- ============================================================
-- Row Level Security (RLS)
-- We disable RLS completely for this build since admin auth is 
-- handled via cookie-based admin_code in Next.js Server Actions/APIs,
-- and public users need read/insert access without Supabase session.
-- ============================================================
alter table locations disable row level security;
alter table products disable row level security;
alter table orders disable row level security;
alter table order_items disable row level security;

-- ============================================================
-- Trigger: updated_at on products and locations
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

create trigger locations_updated_at
  before update on locations
  for each row execute function update_updated_at();

-- ============================================================
-- RPC: Atomic stock decrement
-- ============================================================
create or replace function decrement_stock(p_product_id uuid, p_qty integer)
returns void as $$
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
$$ language plpgsql;

-- ============================================================
-- RPC: Restore stock (for cancelled orders)
-- ============================================================
create or replace function restore_stock(p_product_id uuid, p_qty integer)
returns void as $$
begin
  update products
  set stock = stock + p_qty,
      is_active = true
  where id = p_product_id;
end;
$$ language plpgsql;

-- ============================================================
-- Seed: Sample Locations & Products
-- ============================================================
DO $$
DECLARE
  loc1_id uuid := gen_random_uuid();
  loc2_id uuid := gen_random_uuid();
BEGIN
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
END $$;
