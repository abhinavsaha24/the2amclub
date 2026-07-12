/**
 * Generate a unique order number: 2AM-YYMMDD-XXXX
 */
export function generateOrderNo(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `2AM-${yy}${mm}${dd}-${rand}`;
}

/**
 * Format price in INR
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date/time string
 */
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateStr));
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Debounce helper
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Validate Indian mobile number (10 digits, starting with 6-9)
 */
export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ""));
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Truncate string
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

/**
 * Get Supabase public image URL
 */
export function getImageUrl(path: string | null): string {
  if (!path)
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23141414' width='400' height='300'/%3E%3Ctext fill='%23333' font-family='system-ui' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

/**
 * Order status display config
 */
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: "Awaiting Verification",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/30",
    description: "Your order is placed. Admin is verifying your payment.",
  },
  confirmed: {
    label: "Payment Confirmed",
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/30",
    description: "Payment verified! Your order is being prepared.",
  },
  ready: {
    label: "Ready for Pickup",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10 border-cyan-400/30",
    description: "Your order is ready! Head to the pickup location.",
  },
  collected: {
    label: "Collected",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/30",
    description: "Order collected. Enjoy your meal! 🎉",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-gray-400",
    bg: "bg-gray-400/10 border-gray-400/30",
    description: "This order has been cancelled.",
  },
} as const;
