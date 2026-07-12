import { BaseRepository } from "./base.repository";
import { DatabaseError } from "../errors";
import { Location } from "@/types";

export type UpdateLocationDTO = Partial<Omit<Location, "id" | "created_at" | "updated_at">>;

export class LocationRepository extends BaseRepository<Location> {
  constructor() {
    super("locations");
  }

  async update(id: string, updates: UpdateLocationDTO): Promise<Location> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update location: ${error.message}`);
    }

    return data as Location;
  }
}
