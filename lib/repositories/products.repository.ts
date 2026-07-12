import { BaseRepository } from "./base.repository";
import { DatabaseError } from "../errors";
import { Product } from "@/types"; // assuming this exists, if not we define inline or rely on any

export interface InsertProductDTO {
  location_id: string;
  name: string;
  category: string;
  description?: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  image?: string | null;
}
export type UpdateProductDTO = Partial<InsertProductDTO>;

export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super("products");
  }

  async findByLocationId(locationId: string): Promise<Product[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("location_id", locationId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch products: ${error.message}`);
    }

    return data as Product[];
  }

  async insert(product: InsertProductDTO): Promise<Product> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(product)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to insert product: ${error.message}`);
    }

    return data as Product;
  }

  async update(id: string, locationId: string, updates: UpdateProductDTO): Promise<Product> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update(updates)
      .eq("id", id)
      .eq("location_id", locationId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update product: ${error.message}`);
    }

    return data as Product;
  }
}
