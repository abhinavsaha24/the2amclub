import { NextRequest } from "next/server";
import { storeService } from "@/lib/services";
import { UpdateStoreValidator } from "@/lib/validators";
import { ValidationError } from "@/lib/errors";
import {
  withStoreAdminApiHandler,
  successResponse,
  StoreAdminContext
} from "@/lib/utils/api";

export const PUT = withStoreAdminApiHandler(
  "update_settings",
  async (req: NextRequest, ctx: StoreAdminContext) => {
    const formData = await req.formData();
    const dataString = formData.get("data") as string;
    
    if (!dataString) throw new ValidationError("Missing settings data");
    
    let rawData;
    try {
      rawData = JSON.parse(dataString);
    } catch {
      throw new ValidationError("Invalid JSON format for settings data");
    }

    const validationResult = UpdateStoreValidator.safeParse(rawData);
    if (!validationResult.success) {
      throw new ValidationError(
        "Validation failed",
        validationResult.error.format()
      );
    }

    const file = formData.get("qr_image") as File | null;
    let qrBuffer: Buffer | undefined = undefined;
    let qrMime: string | undefined = undefined;
    let qrPath: string | undefined = undefined;

    if (file) {
      if (!file.type.startsWith("image/")) {
        throw new ValidationError("Uploaded file is not a valid image");
      }
      const arrayBuffer = await file.arrayBuffer();
      qrBuffer = Buffer.from(arrayBuffer);
      qrMime = file.type;
      
      const fileExt = file.name.split('.').pop() || 'webp';
      const safeFilename = crypto.randomUUID() + "." + fileExt;
      qrPath = `${ctx.storeId}/qr/${safeFilename}`;
    }

    const oldQrPath = rawData.old_qr_path || null;

    const store = await storeService.updateSettings(
      ctx.userId,
      ctx.organizationId,
      ctx.storeId,
      validationResult.data,
      qrBuffer,
      qrMime,
      qrPath,
      oldQrPath
    );

    return successResponse(store, "Store settings updated successfully");
  }
);
