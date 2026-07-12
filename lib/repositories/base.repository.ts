import { DatabaseError, NotFoundError } from "../errors";

export class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected async getClient() {
    // Rely on authenticated client for RLS
    const { createClient } = await import("../supabase/server");
    return await createClient();
  }


  async findById(id: string, ..._args: any[]): Promise<T | null> {
    const client = await this.getClient();
    const { data, error } = await client
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

  async delete(id: string, ..._args: any[]): Promise<void> {
    const client = await this.getClient();
    const { error } = await client.from(this.tableName).delete().eq("id", id);
    if (error) {
      throw new DatabaseError(`Failed to delete from ${this.tableName}: ${error.message}`);
    }
  }
}
