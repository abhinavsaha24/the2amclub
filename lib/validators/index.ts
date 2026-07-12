import { z } from "zod";

export const InsertProductValidator = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().nullable().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative"),
  is_active: z.boolean().default(true),
});

export const UpdateStoreValidator = z.object({
  name: z.string().min(1, "Store name is required").optional(),
  opening_hours: z.string().nullable().optional(),
  closing_hours: z.string().nullable().optional(),
  pickup_address: z.string().nullable().optional(),
  shop_open: z.boolean().optional(),
  notice: z.string().nullable().optional(),
  upi_id: z.string().nullable().optional(),
});
