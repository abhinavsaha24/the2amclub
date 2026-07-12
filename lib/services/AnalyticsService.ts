import { createServiceRoleClient } from "../supabase/server";

export class AnalyticsService {
  async getPlatformStats() {
    const supabase = createServiceRoleClient();
    
    const { count: orgCount } = await supabase.from("organizations").select("*", { count: "exact", head: true });
    const { count: storeCount } = await supabase.from("stores").select("*", { count: "exact", head: true });
    
    const { data: revenueOrders } = await supabase
      .from("orders")
      .select("total")
      .in("status", ["confirmed", "collected"]);
    const totalRevenue = revenueOrders?.reduce((acc, o) => acc + Number(o.total), 0) ?? 0;

    return {
      totalOrganizations: orgCount || 0,
      totalStores: storeCount || 0,
      totalRevenue,
    };
  }

  async getStoreStats(storeId: string) {
    const supabase = createServiceRoleClient();
    
    const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true }).eq("store_id", storeId);
    
    // Using a simplistic sum aggregation via JS since RPCs are faster but we haven't strictly created the RPC yet.
    // In production we would create a proper materialized view or RPC.
    const { data: orders } = await supabase.from("orders").select("total").eq("store_id", storeId);
    const revenue = orders?.reduce((acc, order) => acc + Number(order.total), 0) || 0;

    const { count: lowStock } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", storeId)
      .lte("stock", 10);

    return {
      totalOrders: orderCount || 0,
      totalRevenue: revenue,
      lowStockCount: lowStock || 0,
    };
  }
}
