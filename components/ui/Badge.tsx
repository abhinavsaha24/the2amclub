"use client";

import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/types";

const statusConfig: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "Awaiting Verification", cls: "badge-pending" },
  confirmed: { label: "Confirmed", cls: "badge-confirmed" },
  cancelled: { label: "Cancelled", cls: "badge-cancelled" },
  ready: { label: "Ready for Pickup", cls: "badge-ready" },
  collected: { label: "Collected", cls: "badge-collected" },
};

interface BadgeProps {
  status?: OrderStatus;
  label?: string;
  className?: string;
  variant?: "green" | "red" | "yellow" | "cyan" | "purple" | "gray";
  size?: "sm" | "md";
}

const variantMap: Record<string, string> = {
  green: "bg-green-400/10 text-green-400 border border-green-400/30",
  red: "bg-red-400/10 text-red-400 border border-red-400/30",
  yellow: "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30",
  cyan: "bg-cyan-400/10 text-cyan-400 border border-cyan-400/30",
  purple: "bg-purple-400/10 text-purple-400 border border-purple-400/30",
  gray: "bg-gray-400/10 text-gray-400 border border-gray-400/30",
};

export function Badge({
  status,
  label,
  className = "",
  variant,
  size = "md",
}: BadgeProps) {
  const cfg = status ? statusConfig[status] : null;
  const text = label ?? cfg?.label ?? "";
  const cls = variant ? variantMap[variant] : (cfg?.cls ?? "");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-body font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs",
        cls,
        className,
      )}
    >
      {text}
    </span>
  );
}
