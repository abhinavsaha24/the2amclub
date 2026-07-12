import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types";
import { logger } from "@/lib/logger";

const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["ready", "cancelled"],
  ready: ["collected"],
  collected: [],
  cancelled: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status: newStatus } = await request.json();

    if (!newStatus || !id) {
      return NextResponse.json(
        { error: "Missing order ID or status" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    // Fetch current order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, order_items(product_id, qty)")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from "${order.status}" to "${newStatus}"`,
        },
        { status: 400 },
      );
    }

    // If cancelling, restore stock
    if (newStatus === "cancelled") {
      for (const item of order.order_items as Array<{
        product_id: string;
        qty: number;
      }>) {
        await supabase.rpc("restore_stock", {
          p_product_id: item.product_id,
          p_qty: item.qty,
        });
      }
    }

    // Update status
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", id);

    if (updateError) {
      logger.error({ action: "update_order_status", error: updateError });
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ action: "update_order_status_unhandled", error: err });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
