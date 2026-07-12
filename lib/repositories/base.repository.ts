import { createServiceRoleClient } from "../supabase/server";
import { DatabaseError, NotFoundError } from "../errors";

export class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected get client() {
    return createServiceRoleClient();
  }

  async findById(id: string): Promise<T> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to find record in ${this.tableName}: ${error.message}`);
    }
    if (!data) {
      throw new NotFoundError(`Record not found in ${this.tableName}`);
    }

    return data as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(this.tableName).delete().eq("id", id);
    if (error) {
      throw new DatabaseError(`Failed to delete from ${this.tableName}: ${error.message}`);
    }
  }
}
