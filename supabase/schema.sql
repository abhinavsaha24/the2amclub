-- ============================================================
-- The 2AM Club - Supabase Database Schema (v2 — UPI QR Flow)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Products table
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
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

-- Orders table (v2 — no Razorpay, manual UPI verification)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  customer_name text not null,
  customer_phone text not null,
  total numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','confirmed','ready','collected','cancelled')),
  utr_reference text,
  created_at timestamptz default now()
);

-- Order items table
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) not null,
  qty integer not null check (qty > 0),
  price numeric(10,2) not null
);

-- Settings table (singleton row, id=1)
create table if not exists settings (
  id integer primary key default 1 check (id = 1),
  shop_open boolean not null default true,
  notice text,
  upi_qr_image text,
  upi_id text,
  pickup_address text,
  updated_at timestamptz default now()
);

-- Insert default settings row
insert into settings (id, shop_open, notice, pickup_address) values (1, true, null, 'Hostel Counter — Ground Floor')
on conflict (id) do nothing;

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_name on products(name);
create index if not exists idx_products_active on products(is_active);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_phone on orders(customer_phone);
create index if not exists idx_order_items_order_id on order_items(order_id);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Products: public read, authenticated write
alter table products enable row level security;
create policy "Public read products" on products for select using (true);
create policy "Admin manage products" on products for all using (auth.role() = 'authenticated');

-- Orders: insert for all (customers place orders), select for all (track by ID), update for authenticated
alter table orders enable row level security;
create policy "Customers create orders" on orders for insert with check (true);
create policy "Public read orders" on orders for select using (true);
create policy "Admin update orders" on orders for update using (auth.role() = 'authenticated');

-- Order items: insert for all, read for all (needed for order tracking)
alter table order_items enable row level security;
create policy "Customers create order items" on order_items for insert with check (true);
create policy "Public read order items" on order_items for select using (true);

-- Settings: public read, authenticated write
alter table settings enable row level security;
create policy "Public read settings" on settings for select using (true);
create policy "Admin update settings" on settings for all using (auth.role() = 'authenticated');

-- ============================================================
-- Trigger: updated_at on products
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

-- ============================================================
-- Seed: Sample products
-- ============================================================
insert into products (name, category, description, price, stock, is_active) values
  ('Maggi Masala', 'Noodles', 'Classic instant noodles with spicy masala twist', 30.00, 50, true),
  ('Butter Maggi', 'Noodles', 'Maggi loaded with butter and cheese', 40.00, 30, true),
  ('Veg Sandwich', 'Sandwiches', 'Toasted sandwich with fresh veggies and green chutney', 50.00, 25, true),
  ('Cheese Sandwich', 'Sandwiches', 'Grilled sandwich loaded with melted cheese', 60.00, 20, true),
  ('Bread Omelette', 'Egg Items', 'Fluffy omelette served between toasted bread slices', 45.00, 30, true),
  ('Masala Tea', 'Beverages', 'Ginger-cardamom chai brewed fresh', 15.00, 100, true),
  ('Black Coffee', 'Beverages', 'Strong brewed coffee to keep you going', 20.00, 80, true),
  ('Poha', 'Breakfast', 'Flattened rice with mustard seeds and curry leaves', 25.00, 40, true),
  ('Upma', 'Breakfast', 'Savory semolina with vegetables', 25.00, 35, true),
  ('Paratha', 'Breakfast', 'Whole wheat flatbread, served with curd', 35.00, 30, true),
  ('Samosa (2 pcs)', 'Snacks', 'Crispy potato-filled pastry with green chutney', 20.00, 60, true),
  ('Biscuits', 'Snacks', 'Assorted packaged biscuits', 10.00, 100, true),
  ('Cup Noodles', 'Noodles', 'Ready-to-eat cup noodles, just add hot water', 25.00, 40, true),
  ('Boiled Eggs (2 pcs)', 'Egg Items', 'Hard boiled eggs with salt and pepper', 20.00, 50, true),
  ('Aloo Paratha', 'Breakfast', 'Stuffed potato flatbread with butter', 45.00, 25, true)
on conflict do nothing;

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
$$ language plpgsql security definer;

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
$$ language plpgsql security definer;

-- ============================================================
-- MIGRATION: If upgrading from v1 (Razorpay schema)
-- Run these ALTER statements on an existing database:
-- ============================================================
-- ALTER TABLE orders DROP COLUMN IF EXISTS payment_id;
-- ALTER TABLE orders DROP COLUMN IF EXISTS razorpay_order_id;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS utr_reference text;
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
-- ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','confirmed','ready','collected','cancelled'));
-- ALTER TABLE settings ADD COLUMN IF NOT EXISTS upi_qr_image text;
-- ALTER TABLE settings ADD COLUMN IF NOT EXISTS upi_id text;
-- ALTER TABLE settings ADD COLUMN IF NOT EXISTS pickup_address text;
-- UPDATE settings SET pickup_address = 'Hostel Counter — Ground Floor' WHERE id = 1 AND pickup_address IS NULL;
