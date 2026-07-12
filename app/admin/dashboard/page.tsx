"use client";
import { getStoreId } from "@/lib/storeAuth";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  RefreshCw,
  Download,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Order, Product, DashboardStats } from "@/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const storeId = await getStoreId();
    if (!storeId) return;

    const supabase = createClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { data: todayOrders },
      { data: allOrders },
      { data: recent },
      { data: lowStock },
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("total")
        .eq("store_id", storeId)
        .in("status", ["confirmed", "ready", "collected"])
        .gte("created_at", today.toISOString()),
      supabase
        .from("orders")
        .select("total")
        .eq("store_id", storeId)
        .in("status", ["confirmed", "ready", "collected"]),
      supabase
        .from("orders")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .gt("stock", 0)
        .lte("stock", 5)
        .order("stock"),
    ]);

    setStats({
      today_orders: todayOrders?.length ?? 0,
      today_revenue: todayOrders?.reduce((s, o) => s + Number(o.total), 0) ?? 0,
      total_orders: allOrders?.length ?? 0,
      total_revenue: allOrders?.reduce((s, o) => s + Number(o.total), 0) ?? 0,
      low_stock_count: lowStock?.length ?? 0,
    });
    setRecentOrders((recent as Order[]) ?? []);
    setLowStockProducts((lowStock as Product[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CSV Export
  const exportCSV = async () => {
    const storeId = await getStoreId();
    if (!storeId) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select(
        "order_no, customer_name, customer_phone, total, status, utr_reference, created_at",
      )
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (!data) return;

    const header =
      "Order No,Customer Name,Phone,Total,Status,UTR Reference,Date";
    const rows = data.map(
      (o) =>
        `${o.order_no},${o.customer_name},${o.customer_phone},${o.total},${o.status},${o.utr_reference ?? ""},${o.created_at}`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `2amclub-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="xl" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Today's Orders",
      value: stats?.today_orders.toString() ?? "0",
      icon: <ShoppingBag size={20} className="text-cyan-500" />,
      color: "bg-cyan-500/10",
      sub: "paid orders today",
    },
    {
      label: "Today's Revenue",
      value: formatPrice(stats?.today_revenue ?? 0),
      icon: <TrendingUp size={20} className="text-green-500" />,
      color: "bg-green-500/10",
      sub: "from today's paid orders",
    },
    {
      label: "Total Orders",
      value: stats?.total_orders.toString() ?? "0",
      icon: <Package size={20} className="text-primary" />,
      color: "bg-primary/10",
      sub: "all time",
    },
    {
      label: "Total Revenue",
      value: formatPrice(stats?.total_revenue ?? 0),
      icon: <TrendingUp size={20} className="text-pink-500" />,
      color: "bg-pink-500/10",
      sub: "all time",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={exportCSV}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                {card.label}
              </p>
              <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
            </div>
            <p className="font-heading text-3xl font-bold text-foreground">
              {card.value}
            </p>
            <p className="text-muted-foreground text-xs">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="text-orange-500 shrink-0 mt-0.5"
            />
            <div>
              <p className="font-heading font-semibold text-orange-600 dark:text-orange-400">
                Low Stock Alert ({lowStockProducts.length} items)
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {lowStockProducts.map((p) => (
                  <span
                    key={p.id}
                    className="text-xs font-medium text-orange-600 dark:text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-500/20"
                  >
                    {p.name}: {p.stock} left
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold text-foreground">
            Recent Orders
          </h2>
          <Link href="/admin/orders">
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ArrowUpRight size={14} />}
            >
              View All
            </Button>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  {["Order #", "Customer", "Total", "Status", "Time"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground text-sm"
                    >
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-heading text-sm font-semibold text-primary">
                        {order.order_no}
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {order.customer_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.customer_phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-heading text-sm font-semibold text-foreground">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={order.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
