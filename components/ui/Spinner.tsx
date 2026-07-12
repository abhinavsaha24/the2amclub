"use client";

import { cn } from "@/lib/cn";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "purple" | "cyan" | "white";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-2",
  xl: "h-16 w-16 border-[3px]",
};

const colorMap = {
  purple: "border-purple-500/30 border-t-purple-500",
  cyan: "border-cyan-500/30 border-t-cyan-500",
  white: "border-white/20 border-t-white",
};

export function Spinner({
  size = "md",
  color = "purple",
  className = "",
}: SpinnerProps) {
  return (
    <div
      className={cn(
        "rounded-full animate-spin",
        sizeMap[size],
        colorMap[color],
        className,
      )}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Spinner size="xl" color="purple" />
      <p className="text-text-secondary text-sm animate-pulse font-body">
        Loading…
      </p>
    </div>
  );
}
