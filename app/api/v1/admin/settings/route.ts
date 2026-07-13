import { NextRequest } from "next/server";
import { storeService } from "@/lib/services";
import { UpdateStoreValidator } from "@/lib/validators";
import { ValidationError } from "@/lib/errors";
import {
  withStoreAdminApiHandler,
  successResponse,
  StoreAdminContext,
} from "@/lib/utils/api";

export const PATCH = withStoreAdminApiHandler(
  "update_settings",
  async (req: NextRequest, ctx: StoreAdminContext) => {
    const formData = await req.formData();

    // Parse individual form fields (as sent by the admin settings page)
    const rawData = {
      shop_open: formData.get("shop_open") === "true",
      notice: formData.get("notice") ?? undefined,
      upi_id: formData.get("upi_id") ?? undefined,
      pickup_address: formData.get("pickup_address") ?? undefined,
    };

    const validationResult = UpdateStoreValidator.safeParse(rawData);
    if (!validationResult.success) {
      throw new ValidationError(
        "Validation failed",
        validationResult.error.format()
      );
    }

    const file = formData.get("qr_image") as File | null;
    let qrBuffer: Buffer | undefined;
    let qrMime: string | undefined;
    let qrPath: string | undefined;

    if (file && file.size > 0) {
      if (!file.type.startsWith("image/")) {
        throw new ValidationError("Uploaded file is not a valid image");
      }
      const arrayBuffer = await file.arrayBuffer();
      qrBuffer = Buffer.from(arrayBuffer);
      qrMime = file.type;

      const fileExt = file.name.split(".").pop() ?? "webp";
      const safeFilename = crypto.randomUUID() + "." + fileExt;
      qrPath = `${ctx.storeId}/qr/${safeFilename}`;
    }

    const oldQrPath = (formData.get("old_qr_path") as string | null) ?? null;

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
