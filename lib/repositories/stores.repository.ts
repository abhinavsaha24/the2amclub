import { BaseRepository } from "./base.repository";
import { DatabaseError } from "../errors";
import { Store } from "@/types";

export interface UpdateStoreDTO {
  name?: string;
  logo?: string | null;
  banner?: string | null;
  upi_id?: string | null;
  qr_code?: string | null;
  pickup_address?: string | null;
  opening_hours?: string | null;
  closing_hours?: string | null;
  shop_open?: boolean;
  notice?: string | null;
}

export class StoreRepository extends BaseRepository<Store> {
  constructor() {
    super("stores");
  }

  async findById(id: string): Promise<Store | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new DatabaseError(`Failed to fetch store: ${error.message}`);
    }

    return data as Store | null;
  }

  async update(id: string, organizationId: string, updates: UpdateStoreDTO): Promise<Store> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update store: ${error.message}`);
    }

    return data as Store;
  }
}
