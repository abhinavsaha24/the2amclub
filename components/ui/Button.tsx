"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { Check } from "lucide-react";

const buttonVariants = cva(
  // Base styles
  "relative inline-flex items-center justify-center gap-2 font-medium font-body rounded-lg transition-colors duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-black overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-zinc-200 active:bg-zinc-300",
        secondary:
          "bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800 hover:border-white/20 active:bg-zinc-700",
        outline:
          "bg-transparent border border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white active:bg-white/10",
        ghost:
          "bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white active:bg-white/10",
        danger:
          "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 active:bg-red-500/30",
        success:
          "bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 active:bg-green-500/30",
      },
      size: {
        xs: "px-3 py-1.5 text-xs",
        sm: "px-4 py-2 text-sm",
        md: "px-5 py-2.5 text-sm",
        lg: "px-8 py-3.5 text-base",
        xl: "px-10 py-4 text-lg",
        icon: "p-2",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

interface ButtonProps
  extends
    Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant,
      size,
      fullWidth,
      loading,
      success,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || loading || success}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="truncate">{children as React.ReactNode}</span>
          </>
        ) : success ? (
          <>
            <Check size={16} className="shrink-0" />
            <span className="truncate">Success</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span className="truncate">{children as React.ReactNode}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
