import { NextRequest } from "next/server";
import { productService } from "@/lib/services";
import { InsertProductValidator } from "@/lib/validators";
import { ValidationError } from "@/lib/errors";
import {
  withStoreAdminApiHandler,
  successResponse,
  StoreAdminContext
} from "@/lib/utils/api";

export const POST = withStoreAdminApiHandler(
  "create_product",
  async (req: NextRequest, ctx: StoreAdminContext) => {
    const formData = await req.formData();
    const dataString = formData.get("data") as string;
    
    if (!dataString) throw new ValidationError("Missing product data");
    
    let rawData;
    try {
      rawData = JSON.parse(dataString);
    } catch {
      throw new ValidationError("Invalid JSON format for product data");
    }

    const validationResult = InsertProductValidator.safeParse(rawData);
    if (!validationResult.success) {
      throw new ValidationError(
        "Validation failed",
        validationResult.error.format()
      );
    }

    const file = formData.get("image") as File | null;
    let imageBuffer: Buffer | undefined = undefined;
    let imageMime: string | undefined = undefined;
    let imagePath: string | undefined = undefined;

    if (file) {
      if (!file.type.startsWith("image/")) {
        throw new ValidationError("Uploaded file is not a valid image");
      }
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      imageMime = file.type;
      
      const fileExt = file.name.split('.').pop() || 'webp';
      const safeFilename = crypto.randomUUID() + "." + fileExt;
      imagePath = `${ctx.storeId}/products/${safeFilename}`;
    }

    const product = await productService.createProduct(
      ctx.userId,
      ctx.organizationId,
      ctx.storeId,
      validationResult.data,
      imageBuffer,
      imageMime,
      imagePath
    );

    return successResponse(product, "Product created successfully", 201);
  }
);
