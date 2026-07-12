import { BaseRepository } from "./base.repository";
import { DatabaseError } from "../errors";
import { UserRole } from "@/types";

export interface CreateInvitationDTO {
  hashed_code: string;
  organization_id: string;
  store_id: string;
  role: UserRole;
  creator_id: string;
  max_uses?: number;
  expires_at?: string;
}

export interface InvitationCode {
  id: string;
  hashed_code: string;
  organization_id: string;
  store_id: string;
  role: UserRole;
  creator_id: string | null;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_revoked: boolean;
  created_at: string;
}

export class InvitationRepository extends BaseRepository<InvitationCode> {
  constructor() {
    super("invitation_codes");
  }

  async findByHashedCode(hashedCode: string): Promise<InvitationCode | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select("*")
      .eq("hashed_code", hashedCode)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new DatabaseError(`Failed to find invitation: ${error.message}`);
    }

    return data as InvitationCode;
  }

  async insert(invitation: CreateInvitationDTO): Promise<InvitationCode> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .insert(invitation)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to insert invitation: ${error.message}`);
    }

    return data as InvitationCode;
  }

  async incrementUsage(id: string): Promise<void> {
    // Requires executing an RPC or relying on a direct increment, but we can do a simple update since traffic is low
    // For safer concurrency, this should be an RPC. For now, we'll increment locally.
    const client = await this.getClient();
    const { data: current } = await client.from(this.tableName).select("used_count").eq("id", id).single();
    if (current) {
      const { error } = await client.from(this.tableName).update({ used_count: current.used_count + 1 }).eq("id", id);
      if (error) throw new DatabaseError(`Failed to increment usage: ${error.message}`);
    }
  }

  async revoke(id: string, storeId: string): Promise<void> {
    const client = await this.getClient();
    const { error } = await client
      .from(this.tableName)
      .update({ is_revoked: true })
      .eq("id", id)
      .eq("store_id", storeId);
      
    if (error) throw new DatabaseError(`Failed to revoke invitation: ${error.message}`);
  }

  async logUsage(invitationId: string, profileId: string): Promise<void> {
    const client = await this.getClient();
    const { error } = await client
      .from("invitation_usage")
      .insert({ invitation_id: invitationId, profile_id: profileId });
      
    if (error) throw new DatabaseError(`Failed to log usage: ${error.message}`);
  }

  async findByStoreId(storeId: string): Promise<InvitationCode[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) throw new DatabaseError(`Failed to list invitations: ${error.message}`);
    
    return data as InvitationCode[];
  }
}
