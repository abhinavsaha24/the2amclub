import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  category: z.string().min(2, "Category is required"),
  price: z.coerce.number().positive("Price must be positive"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  is_active: z.coerce.boolean(),
  description: z.string().optional(),
});

export const LocationSettingsSchema = z.object({
  shop_open: z.coerce.boolean(),
  notice: z.string().max(255).optional(),
  upi_id: z.string().max(100).optional(),
  pickup_address: z.string().max(500).optional(),
});
