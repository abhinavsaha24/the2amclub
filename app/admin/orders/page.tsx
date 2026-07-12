"use client";
import { getStoreId } from "@/lib/storeAuth";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { formatPrice, formatDate } from "@/lib/utils";
import { RefreshCw, ChevronDown, Search, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { Order, OrderStatus } from "@/types";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "ready",
  "collected",
  "cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const storeId = await getStoreId();
    if (!storeId) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(product_id, qty, price, product:products(name))")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      toast.success("Order status updated");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    } catch (err: any) {
      toast.error(err.message || "Status update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch =
      o.order_no.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search) ||
      (o.utr_reference &&
        o.utr_reference.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">
            Orders
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {orders.length} total orders
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
          onClick={() => {
            setLoading(true);
            fetchOrders();
          }}
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="Search by order #, name, phone, or UTR…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
            id="order-search"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
            }`}
          >
            All
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="xl" />
        </div>
      ) : (
        <div className="bg-card border border-border overflow-hidden rounded-2xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  {[
                    "Order #",
                    "Customer",
                    "Items",
                    "Total",
                    "Status",
                    "Payment Ref",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      No orders found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-heading text-sm font-semibold text-primary whitespace-nowrap">
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
                      <td className="px-5 py-4">
                        <div className="max-w-[160px] space-y-0.5">
                          {order.order_items?.map((item) => (
                            <p
                              key={item.id}
                              className="text-xs text-muted-foreground truncate"
                            >
                              {(item.product as { name: string })?.name} ×{" "}
                              {item.qty}
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-heading text-sm font-semibold text-foreground whitespace-nowrap">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={order.status} size="sm" />
                      </td>
                      <td className="px-5 py-4">
                        {order.utr_reference ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-mono border border-border">
                            {order.utr_reference}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            None
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        {updatingId === order.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <div className="flex items-center gap-2">
                            {order.status === "pending" && (
                              <button
                                onClick={() =>
                                  updateStatus(order.id, "confirmed")
                                }
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all text-xs font-medium shrink-0"
                                title="Confirm Payment"
                              >
                                <CheckCircle size={14} />
                                Confirm
                              </button>
                            )}
                            <div className="relative">
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  updateStatus(
                                    order.id,
                                    e.target.value as OrderStatus,
                                  )
                                }
                                className="appearance-none bg-background border border-border text-foreground text-xs rounded-lg px-3 py-1.5 pr-7 cursor-pointer hover:bg-muted transition-all focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option
                                    key={s}
                                    value={s}
                                    className="bg-background"
                                  >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={12}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                              />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
