import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceRoleClient();

  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: "unknown",
    storage: "unknown",
    version: "v1.0.0",
  };

  try {
    const { error: dbError } = await supabase.from("locations").select("id").limit(1);
    health.database = dbError ? "error" : "healthy";
  } catch {
    health.database = "error";
  }

  try {
    const { error: storageError } = await supabase.storage.getBucket("product-images");
    health.storage = storageError ? "error" : "healthy";
  } catch {
    health.storage = "error";
  }

  const statusCode = health.database === "error" || health.storage === "error" ? 503 : 200;

  return NextResponse.json(health, { status: statusCode });
}
