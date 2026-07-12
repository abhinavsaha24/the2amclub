import crypto from "crypto";
import { InvitationRepository } from "../repositories/invitation.repository";
import { BusinessLogicError } from "../errors";
import { UserRole } from "@/types";
import { createServiceRoleClient } from "../supabase/server";

export class InvitationService {
  private repository: InvitationRepository;

  constructor() {
    this.repository = new InvitationRepository();
  }

  // Generates a hash for the plain text code
  private hash(code: string): string {
    return crypto.createHash("sha256").update(code).digest("hex");
  }

  // Generate a cryptographically secure 8-character alphanumeric code
  private generateCode(): string {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
  }

  async createInvitation(
    organizationId: string,
    storeId: string,
    role: UserRole,
    creatorId: string,
    maxUses: number = 1,
    expiresInDays: number = 7
  ): Promise<{ code: string; expiresAt: string }> {
    const rawCode = this.generateCode();
    const hashedCode = this.hash(rawCode);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.repository.insert({
      hashed_code: hashedCode,
      organization_id: organizationId,
      store_id: storeId,
      role,
      creator_id: creatorId,
      max_uses: maxUses,
      expires_at: expiresAt.toISOString(),
    });

    return { code: rawCode, expiresAt: expiresAt.toISOString() };
  }

  async revokeInvitation(id: string, storeId: string): Promise<void> {
    await this.repository.revoke(id, storeId);
  }

  async getInvitations(storeId: string) {
    return this.repository.findByStoreId(storeId);
  }

  async consumeInvitation(rawCode: string, profileId: string): Promise<{ storeId: string; organizationId: string; role: string }> {
    const hashedCode = this.hash(rawCode);
    const invitation = await this.repository.findByHashedCode(hashedCode);

    if (!invitation) {
      throw new BusinessLogicError("Invalid invitation code.");
    }

    if (invitation.is_revoked) {
      throw new BusinessLogicError("This invitation has been revoked.");
    }

    if (invitation.used_count >= invitation.max_uses) {
      throw new BusinessLogicError("This invitation has reached its maximum usage limit.");
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      throw new BusinessLogicError("This invitation has expired.");
    }

    // Assign the user to the store. This REQUIRES Service Role because RLS might prevent a generic user from inserting into store_members
    const adminClient = createServiceRoleClient();
    
    // Check if user is already a member
    const { data: existing } = await adminClient
      .from("store_members")
      .select("id")
      .eq("store_id", invitation.store_id)
      .eq("profile_id", profileId)
      .single();

    if (existing) {
      throw new BusinessLogicError("You are already a member of this store.");
    }

    // Insert membership
    const { error: insertError } = await adminClient
      .from("store_members")
      .insert({
        store_id: invitation.store_id,
        profile_id: profileId,
        role: invitation.role
      });

    if (insertError) {
      throw new BusinessLogicError(`Failed to join store: ${insertError.message}`);
    }

    // Increment usage and log
    await this.repository.incrementUsage(invitation.id);
    await this.repository.logUsage(invitation.id, profileId);

    // Also update their profile role to the highest role they possess if they were just STAFF
    const { data: profile } = await adminClient.from("profiles").select("role").eq("id", profileId).single();
    if (profile && profile.role === "STAFF" && invitation.role !== "STAFF") {
      await adminClient.from("profiles").update({ role: invitation.role }).eq("id", profileId);
    }

    return {
      storeId: invitation.store_id,
      organizationId: invitation.organization_id,
      role: invitation.role
    };
  }
}
