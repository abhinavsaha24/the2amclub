import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { locationService } from "@/lib/services";
import { withApiHandler, successResponse } from "@/lib/utils/api";
import { AuthenticationError, ValidationError } from "@/lib/errors";
import { LocationSettingsSchema } from "@/lib/validators";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

async function processImage(file: File | null): Promise<{ buffer?: Buffer; mime?: string }> {
  if (!file) return {};
  if (file.size > MAX_SIZE_BYTES) throw new ValidationError("File too large. Maximum size is 2MB.");
  if (!ALLOWED_MIME_TYPES.includes(file.type)) throw new ValidationError("Unsupported file type.");

  const arrayBuffer = await file.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);

  try {
    const buffer = await sharp(rawBuffer)
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return { buffer, mime: "image/webp" };
  } catch (err) {
    throw new ValidationError("Failed to process image.");
  }
}

export const PATCH = withApiHandler("update_settings", async (req: NextRequest) => {
  const locationId = await getAdminSession();
  if (!locationId) throw new AuthenticationError();

  const formData = await req.formData();
  
  const rawPayload = {
    shop_open: formData.get("shop_open"),
    notice: formData.get("notice") || "",
    upi_id: formData.get("upi_id") || "",
    pickup_address: formData.get("pickup_address") || "",
  };

  const validation = LocationSettingsSchema.safeParse(rawPayload);
  if (!validation.success) {
    throw new ValidationError("Invalid settings data", validation.error.format());
  }

  const oldQrPath = formData.get("oldQr") as string | null;
  const file = formData.get("qr_image") as File | null;
  
  const { buffer, mime } = await processImage(file);
  const newQrPath = buffer ? `${locationId}/qr/${uuidv4()}.webp` : undefined;

  const location = await locationService.updateSettings(
    "admin_session",
    locationId,
    validation.data,
    oldQrPath,
    buffer,
    mime,
    newQrPath
  );

  return successResponse(location, "Settings updated successfully");
});
