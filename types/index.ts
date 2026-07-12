// ============================================================
// Type Definitions — The 2AM Club (v3 - Multi-Admin)
// ============================================================

export interface Location {
  id: string;
  name: string;
  admin_code: string;
  upi_id: string | null;
  upi_qr_image: string | null;
  pickup_address: string | null;
  shop_open: boolean;
  notice: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  location_id: string;
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
  location_id: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: OrderStatus;
  utr_reference: string | null;
  created_at: string;
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
