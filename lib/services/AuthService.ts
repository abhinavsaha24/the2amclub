import { createServiceRoleClient } from "../supabase/server";
import { UserRole } from "@/types";
import { randomBytes, createHash } from "crypto";

export class AuthService {
  /**
   * Generates a cryptographically secure invitation code.
   * Stores only the bcrypt/sha256 hash in the database.
   * Returns the plaintext code ONCE for the Super Admin to distribute.
   */
  async generateInvitation(
    creatorId: string,
    organizationId: string,
    storeId: string,
    role: UserRole,
    maxUses: number = 1
  ): Promise<{ code: string; id: string }> {
    const supabase = createServiceRoleClient();
    const rawCode = `2AM-${randomBytes(4).toString("hex").toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const hashedCode = createHash("sha256").update(rawCode).digest("hex");

    const { data, error } = await supabase
      .from("invitation_codes")
      .insert({
        hashed_code: hashedCode,
        organization_id: organizationId,
        store_id: storeId,
        role,
        creator_id: creatorId,
        max_uses: maxUses,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error("Failed to generate invitation code");
    }

    return { code: rawCode, id: data.id };
  }

  /**
   * Validates a plaintext invitation code.
   */
  async validateInvitation(code: string): Promise<any> {
    const supabase = createServiceRoleClient();
    const hashedCode = createHash("sha256").update(code).digest("hex");

    const { data, error } = await supabase
      .from("invitation_codes")
      .select("*")
      .eq("hashed_code", hashedCode)
      .single();

    if (error || !data) {
      throw new Error("Invalid invitation code");
    }

    if (data.is_revoked) {
      throw new Error("This invitation has been revoked");
    }

    if (data.used_count >= data.max_uses) {
      throw new Error("This invitation has expired (maximum uses reached)");
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      throw new Error("This invitation has expired");
    }

    return data;
  }

  /**
   * Consumes an invitation and links the profile to the store.
   */
  async consumeInvitation(code: string, profileId: string): Promise<void> {
    const invite = await this.validateInvitation(code);
    const supabase = createServiceRoleClient();

    // 1. Add to store_members
    const { error: memberError } = await supabase
      .from("store_members")
      .insert({
        store_id: invite.store_id,
        profile_id: profileId,
        role: invite.role,
      });

    if (memberError) {
      throw new Error("Failed to assign store role: " + memberError.message);
    }

    // 2. Increment used_count
    await supabase
      .from("invitation_codes")
      .update({ used_count: invite.used_count + 1 })
      .eq("id", invite.id);

    // 3. Log usage
    await supabase
      .from("invitation_usage")
      .insert({
        invitation_id: invite.id,
        profile_id: profileId,
      });
  }

  async verifySuperAdmin(profileId: string): Promise<boolean> {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", profileId)
      .single();

    return data?.role === "SUPER_ADMIN";
  }
}
