// ============================================================
// Type Definitions — The 2AM Club (v3 - Multi-Admin)
// ============================================================

export type UserRole = "SUPER_ADMIN" | "STORE_OWNER" | "STORE_MANAGER" | "STAFF";

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  banner: string | null;
  theme_color: string | null;
  support_email: string | null;
  support_phone: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  logo: string | null;
  banner: string | null;
  upi_id: string | null;
  qr_code: string | null;
  pickup_address: string | null;
  opening_hours: string | null;
  closing_hours: string | null;
  shop_open: boolean;
  notice: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreMember {
  id: string;
  store_id: string;
  profile_id: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  organization_id: string;
  store_id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  organization_id: string;
  store_id: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: OrderStatus;
  utr_reference: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export type OrderStatus =
  "pending" | "confirmed" | "ready" | "collected" | "cancelled";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  qty: number;
  price: number;
  product?: Product;
}

// Cart types (client-side only)
export interface CartItem {
  product: Product;
  qty: number;
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateOrderPayload {
  location_id: string;
  customer_name: string;
  customer_phone: string;
  utr_reference?: string;
  items: { product_id: string; qty: number }[];
}

export interface CreateOrderResponse {
  order_id: string;
  order_no: string;
}

// Admin dashboard types
export interface DashboardStats {
  today_orders: number;
  today_revenue: number;
  total_orders: number;
  total_revenue: number;
  low_stock_count: number;
}
