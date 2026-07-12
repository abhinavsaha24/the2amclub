"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card max-w-md w-full p-8 text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle size={32} className="text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-white">
            Something went wrong
          </h1>
          <p className="text-text-muted font-body text-sm">
            We apologize for the inconvenience. Our systems have logged the
            error.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left overflow-hidden">
          <p className="text-xs font-mono text-red-300/80 truncate">
            {error.message || "An unexpected error occurred"}
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-text-muted mt-1">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="default"
            size="md"
            fullWidth
            leftIcon={<RotateCcw size={16} />}
            onClick={reset}
          >
            Try Again
          </Button>
          <Link href="/" className="w-full">
            <Button
              variant="ghost"
              size="md"
              fullWidth
              leftIcon={<Home size={16} />}
            >
              Go Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
