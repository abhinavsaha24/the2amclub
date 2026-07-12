"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle, Package, Home, Copy, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") ?? "";
  const orderNo = searchParams.get("order_no") ?? "";

  const copyOrderNo = () => {
    navigator.clipboard.writeText(orderNo);
    toast.success("Order number copied!");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full text-center space-y-8"
      >
        {/* Animated checkmark */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-green-500/10 animate-ping" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              duration: 0.4,
              type: "spring",
              stiffness: 200,
            }}
            className="relative w-24 h-24 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.3)]"
          >
            <CheckCircle size={48} className="text-green-400" />
          </motion.div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-heading text-4xl font-bold text-white"
          >
            Order Placed! 🎉
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-text-secondary font-body"
          >
            Your order is submitted. Admin will verify your payment shortly.
          </motion.p>
        </div>

        {/* Order Number */}
        {orderNo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card p-6 space-y-3"
          >
            <p className="text-text-muted text-sm font-body">
              Your Order Number
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-heading text-3xl font-bold gradient-text-purple-cyan tracking-wider">
                {orderNo}
              </span>
              <button
                onClick={copyOrderNo}
                className="p-2 rounded-lg bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all"
                aria-label="Copy order number"
              >
                <Copy size={16} />
              </button>
            </div>
            <p className="text-text-muted text-sm font-body">
              Show this number at the counter to collect your order
            </p>
          </motion.div>
        )}

        {/* Status info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
            <Clock size={18} className="text-yellow-400 shrink-0" />
            <p className="text-yellow-300/80 text-sm text-left">
              Your payment is being verified. You&apos;ll see the pickup address
              once confirmed.
            </p>
          </div>

          {[
            { icon: "📱", text: "Payment submitted via UPI" },
            { icon: "⏳", text: "Admin is verifying your payment" },
            { icon: "📍", text: "Pickup address shown after verification" },
          ].map((step) => (
            <div
              key={step.text}
              className="flex items-center gap-3 text-sm font-body text-text-secondary"
            >
              <span className="text-lg">{step.icon}</span>
              <span>{step.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col gap-3"
        >
          {orderId && (
            <Link href={`/order/${orderId}`}>
              <Button
                variant="default"
                size="lg"
                fullWidth
                leftIcon={<Package size={18} />}
              >
                Track Order Status
              </Button>
            </Link>
          )}
          <Link href="/">
            <Button
              variant="ghost"
              size="md"
              fullWidth
              leftIcon={<Home size={16} />}
            >
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-text-muted">Loading...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
