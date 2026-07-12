import { NextRequest, NextResponse } from "next/server";
import { CleanupService } from "@/lib/services/CleanupService";
import { storageService } from "@/lib/services";
import { ProductRepository } from "@/lib/repositories/products.repository";
import { LocationRepository } from "@/lib/repositories/locations.repository";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { waitUntil } from "@vercel/functions";

const productRepo = new ProductRepository();
const locationRepo = new LocationRepository();
const cleanupService = new CleanupService(storageService, productRepo, locationRepo);

export async function POST(req: NextRequest) {
  try {
    // In a real app, verify cron secret or admin session here
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // For local testing, allow if no cron secret is set
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Schedule background job without blocking response
    try {
      waitUntil(cleanupService.deleteOrphanedImages());
    } catch (e) {
      // Fallback if waitUntil is not supported in the current environment
      cleanupService.deleteOrphanedImages().catch(console.error);
    }

    return successResponse({ scheduled: true }, "Cleanup job scheduled in background");
  } catch (error) {
    return errorResponse(error, "cleanup_job_trigger");
  }
}
