import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { productService } from "@/lib/services";
import { withApiHandler, successResponse } from "@/lib/utils/api";
import { AuthenticationError, ValidationError } from "@/lib/errors";
import { ProductSchema } from "@/lib/validators";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

async function processImage(file: File | null): Promise<{ buffer?: Buffer; mime?: string }> {
  if (!file) return {};

  if (file.size > MAX_SIZE_BYTES) {
    throw new ValidationError("File too large. Maximum size is 2MB.");
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ValidationError("Unsupported file type. Use JPG, PNG, or WEBP.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);

  try {
    const buffer = await sharp(rawBuffer)
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return { buffer, mime: "image/webp" };
  } catch (err) {
    throw new ValidationError("Failed to process image. File might be corrupted.");
  }
}

export const POST = withApiHandler("create_product", async (req: NextRequest) => {
  const locationId = await getAdminSession();
  if (!locationId) throw new AuthenticationError();

  const formData = await req.formData();
  
  // Extract payload
  const rawPayload = {
    name: formData.get("name"),
    category: formData.get("category"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    is_active: formData.get("is_active"),
    description: formData.get("description"),
  };

  // Validate via Zod
  const validation = ProductSchema.safeParse(rawPayload);
  if (!validation.success) {
    throw new ValidationError("Invalid product data", validation.error.format());
  }

  // Process Image
  const file = formData.get("image") as File | null;
  const { buffer, mime } = await processImage(file);
  const imagePath = buffer ? `${locationId}/products/${uuidv4()}.webp` : undefined;

  // Execute Service (Saga Pattern handled inside)
  const product = await productService.createProduct(
    "admin_session", // currently admin_code auth just uses locationId, so we lack a distinct admin ID unless we extract it from the cookie or location
    locationId,
    validation.data,
    buffer,
    mime,
    imagePath
  );

  return successResponse(product, "Product created successfully", 201);
});

export const PATCH = withApiHandler("update_product", async (req: NextRequest) => {
  const locationId = await getAdminSession();
  if (!locationId) throw new AuthenticationError();

  const formData = await req.formData();
  const productId = formData.get("id") as string;
  if (!productId) throw new ValidationError("Product ID is required for updating");

  const rawPayload = {
    name: formData.get("name"),
    category: formData.get("category"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    is_active: formData.get("is_active"),
    description: formData.get("description"),
  };

  const validation = ProductSchema.safeParse(rawPayload);
  if (!validation.success) {
    throw new ValidationError("Invalid product data", validation.error.format());
  }

  const oldImagePath = formData.get("oldImage") as string | null;
  const file = formData.get("image") as File | null;
  
  const { buffer, mime } = await processImage(file);
  const newImagePath = buffer ? `${locationId}/products/${uuidv4()}.webp` : undefined;

  const product = await productService.updateProduct(
    "admin_session",
    locationId,
    productId,
    validation.data,
    oldImagePath,
    buffer,
    mime,
    newImagePath
  );

  return successResponse(product, "Product updated successfully");
});

export const DELETE = withApiHandler("delete_product", async (req: NextRequest) => {
  const locationId = await getAdminSession();
  if (!locationId) throw new AuthenticationError();

  const url = new URL(req.url);
  const productId = url.searchParams.get("id");
  const imagePath = url.searchParams.get("imagePath");

  if (!productId) throw new ValidationError("Product ID is required for deletion");

  await productService.deleteProduct("admin_session", locationId, productId, imagePath);

  return successResponse({ deleted: true }, "Product deleted successfully");
});
