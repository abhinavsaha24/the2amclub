import { BaseRepository } from "./base.repository";
import { DatabaseError } from "../errors";
import { Product } from "@/types";

export interface InsertProductDTO {
  organization_id: string;
  store_id: string;
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

  async findByStoreId(organizationId: string, storeId: string): Promise<Product[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select("*")
      .eq("organization_id", organizationId)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch products: ${error.message}`);
    }

    return data as Product[];
  }

  async insert(product: InsertProductDTO): Promise<Product> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .insert(product)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to insert product: ${error.message}`);
    }

    return data as Product;
  }

  async update(id: string, organizationId: string, storeId: string, updates: UpdateProductDTO): Promise<Product> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .eq("store_id", storeId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update product: ${error.message}`);
    }

    return data as Product;
  }

  async delete(id: string, organizationId: string, storeId: string): Promise<void> {
    const client = await this.getClient();
    const { error } = await client
      .from(this.tableName)
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId)
      .eq("store_id", storeId);
      
    if (error) {
      throw new DatabaseError(`Failed to delete product: ${error.message}`);
    }
  }
}
