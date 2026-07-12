export const OrderStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  READY: "ready",
  COLLECTED: "collected",
  CANCELLED: "cancelled",
} as const;

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

export const StorageBuckets = {
  PRODUCT_IMAGES: "product-images",
} as const;

export const Routes = {
  HOME: "/",
  MENU: "/menu",
  CART: "/cart",
  CHECKOUT: "/checkout",
  ADMIN_LOGIN: "/admin/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_PRODUCTS: "/admin/products",
  ADMIN_ORDERS: "/admin/orders",
  ADMIN_SETTINGS: "/admin/settings",
} as const;

export const ApiErrors = {
  UNAUTHORIZED: "UNAUTHORIZED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  STORAGE_ERROR: "STORAGE_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

export const RateLimits = {
  API_GLOBAL: 60, // requests per minute
  UPLOAD: 20, // uploads per minute
} as const;
