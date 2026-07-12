"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatPrice, formatDate, ORDER_STATUS_CONFIG } from "@/lib/utils";
import type { Order, Store } from "@/types";
import Link from "next/link";

const STATUS_STEPS = [
  {
    status: "pending",
    label: "Awaiting Verification",
    icon: <Clock size={20} />,
  },
  {
    status: "confirmed",
    label: "Payment Confirmed",
    icon: <CheckCircle size={20} />,
  },
  { status: "ready", label: "Ready for Pickup", icon: <Package size={20} /> },
  {
    status: "collected",
    label: "Order Collected",
    icon: <CheckCircle size={20} />,
  },
];

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [location, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: orderData, error: err } = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(name, price))")
      .eq("id", id)
      .single();

    if (err || !orderData) {
      setError("Order not found. Please check your order number.");
      setLoading(false);
      return;
    }

    setOrder(orderData as Order);

    // Fetch location for pickup address
    if (orderData.store_id) {
      const { data: locData } = await supabase
        .from("locations")
        .select("*")
        .eq("id", orderData.store_id)
        .single();
      if (locData) {
        setStore(locData as Store);
      }
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();

    // Realtime subscription for order status updates
    const supabase = createClient();
    const subscription = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...payload.new } : null));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id, fetchData]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-app py-20 text-center space-y-4">
        <AlertCircle size={48} className="text-destructive mx-auto" />
        <h2 className="font-heading text-2xl font-bold text-foreground">
          Order Not Found
        </h2>
        <p className="text-muted-foreground">{error}</p>
        <Link href="/">
          <Button variant="default">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const currentStepIdx = STATUS_STEPS.findIndex(
    (s) => s.status === order.status,
  );

  return (
    <div className="container-app py-12 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center md:text-left"
      >
        <h1 className="font-heading text-3xl font-bold text-foreground mb-1">
          Order Status
        </h1>
        <p className="text-muted-foreground">Track your order in real-time</p>
      </motion.div>

      {/* Order Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border p-6 rounded-2xl shadow-sm mt-8 space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-1">
              Order Number
            </p>
            <p className="font-heading text-4xl font-black text-primary">
              {order.order_no}
            </p>
          </div>
          <div className="self-start">
            <Badge status={order.status} size="md" />
          </div>
        </div>

        {/* Status Description */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${statusCfg.bg}`}
        >
          <div className={`mt-0.5 ${statusCfg.color}`}>
            <InfoIcon />
          </div>
          <p
            className={`font-medium text-sm leading-relaxed ${statusCfg.color}`}
          >
            {statusCfg.description}
          </p>
        </div>

        {/* Pickup Address (shown after confirmation) */}
        {["confirmed", "ready", "collected"].includes(order.status) &&
          location?.pickup_address && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-primary/20 bg-primary/5"
            >
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-foreground text-sm font-heading font-bold mb-1">
                    Pickup Store
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {location.pickup_address}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        {/* Progress Steps (only for non-cancelled orders) */}
        {order.status !== "cancelled" && (
          <div className="py-4 space-y-6">
            {STATUS_STEPS.map((step, i) => {
              const isDone = currentStepIdx >= i;
              const isCurrent = currentStepIdx === i;
              return (
                <div
                  key={step.status}
                  className="flex items-center gap-4 relative"
                >
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      className={`absolute left-5 top-10 w-0.5 h-6 -translate-x-1/2 ${isDone && !isCurrent ? "bg-primary" : "bg-border"}`}
                    />
                  )}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all z-10 ${
                      isDone
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary border border-border text-muted-foreground"
                    } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                  >
                    {isCurrent ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        {step.icon}
                      </motion.div>
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <p
                      className={`font-semibold ${isDone ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {step.label}
                    </p>
                    {isDone && !isCurrent && (
                      <CheckCircle
                        size={18}
                        className="text-primary opacity-50"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order Details */}
        <div className="border-t border-border pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">
                Customer
              </p>
              <p className="font-medium text-foreground">
                {order.customer_name}
              </p>
            </div>
            {order.utr_reference && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  Payment Ref (UTR)
                </p>
                <p className="font-mono text-sm text-foreground bg-secondary px-2 py-1 rounded-md inline-block border border-border">
                  {order.utr_reference}
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
              Order Items
            </h3>
            <div className="space-y-3 bg-secondary/50 p-4 rounded-xl border border-border">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    <span className="font-medium">
                      {(item.product as { name: string })?.name ?? "Item"}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      × {item.qty}
                    </span>
                  </span>
                  <span className="font-medium text-foreground">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock size={14} />
              {formatDate(order.created_at)}
            </div>
            <div className="font-heading text-xl font-bold text-foreground">
              Total: {formatPrice(order.total)}
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium bg-secondary/50 py-2 rounded-lg border border-border">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          Live updates enabled
        </div>
      </motion.div>

      {/* Refresh button */}
      <div className="mt-8 text-center">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          leftIcon={<RefreshCw size={14} />}
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
        >
          Refresh Manually
        </Button>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
