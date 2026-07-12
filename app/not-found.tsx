"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md space-y-6"
      >
        <div className="flex justify-center mb-2">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Search size={32} className="text-text-muted" />
          </div>
        </div>

        <div>
          <h1 className="font-heading text-8xl font-bold gradient-text-purple-cyan opacity-80">
            404
          </h1>
          <h2 className="font-heading text-2xl font-bold text-white mt-2">
            Page not found
          </h2>
        </div>

        <p className="text-text-muted font-body">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <div className="flex justify-center pt-4">
          <Link href="/">
            <Button
              variant="default"
              size="lg"
              leftIcon={<ArrowLeft size={18} />}
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
