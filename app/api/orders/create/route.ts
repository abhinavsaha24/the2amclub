import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateOrderNo } from "@/lib/utils";
import type { CreateOrderPayload } from "@/types";
import { logger } from "@/lib/logger";

// Rate limiting (in-memory, resets on restart — good enough for MVP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body: CreateOrderPayload = await request.json();
    const { customer_name, customer_phone, utr_reference, items } = body;

    // Validate input
    if (!customer_name?.trim() || !customer_phone?.trim() || !items?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (!/^[6-9]\d{9}$/.test(customer_phone.trim())) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    // Check shop is open
    const { data: settings } = await supabase
      .from("settings")
      .select("shop_open")
      .eq("id", 1)
      .single();
    if (settings && !settings.shop_open) {
      return NextResponse.json(
        { error: "Shop is currently closed. Please try again later." },
        { status: 400 },
      );
    }

    // Fetch product prices and validate stock
    const productIds = items.map((i) => i.product_id);
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, name, price, stock, is_active")
      .in("id", productIds);

    if (prodError || !products) {
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 },
      );
    }

    // Validate each item
    let total = 0;
    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.product_id}` },
          { status: 400 },
        );
      }
      if (!product.is_active) {
        return NextResponse.json(
          { error: `${product.name} is no longer available` },
          { status: 400 },
        );
      }
      if (product.stock < item.qty) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
          },
          { status: 400 },
        );
      }
      if (item.qty < 1 || item.qty > 20) {
        return NextResponse.json(
          { error: `Invalid quantity for ${product.name}` },
          { status: 400 },
        );
      }
      total += product.price * item.qty;
    }

    // Create order in database (status: pending — awaiting admin verification)
    const orderNo = generateOrderNo();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        total,
        status: "pending",
        utr_reference: utr_reference?.trim() || null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      logger.error({ action: "create_order", error: orderError });
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 },
      );
    }

    // Create order items
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id)!;
      return {
        order_id: order.id,
        product_id: item.product_id,
        qty: item.qty,
        price: product.price,
      };
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);
    
    if (itemsError) {
      logger.error({ action: "create_order_items", error: itemsError });
      return NextResponse.json(
        { error: "Failed to save order items" },
        { status: 500 },
      );
    }

    // Deduct stock immediately to prevent overselling while admin verifies
    for (const item of items) {
      const { error: stockError } = await supabase.rpc("decrement_stock", {
        p_product_id: item.product_id,
        p_qty: item.qty,
      });

      if (stockError) {
        logger.error({ action: "deduct_stock", error: stockError, product_id: item.product_id });
        // Don't fail the order — stock validation was done above
      }
    }

    return NextResponse.json({
      order_id: order.id,
      order_no: orderNo,
    });
  } catch (err) {
    logger.error({ action: "create_order_unhandled", error: err });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
