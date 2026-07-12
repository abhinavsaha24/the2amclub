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
    const { data: dbData, error: dbError } = await supabase.from("locations").select("id").limit(1);
    health.database = dbError ? "error" : "healthy";
  } catch (e) {
    health.database = "error";
  }

  try {
    const { data: storageData, error: storageError } = await supabase.storage.getBucket("product-images");
    health.storage = storageError ? "error" : "healthy";
  } catch (e) {
    health.storage = "error";
  }

  const statusCode = health.database === "error" || health.storage === "error" ? 503 : 200;

  return NextResponse.json(health, { status: statusCode });
}
