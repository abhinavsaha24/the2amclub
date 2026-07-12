import { NextRequest } from "next/server";
import { authService } from "@/lib/services";
import { successResponse, errorResponse } from "@/lib/utils/api";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, inviteCode } = await req.json();

    if (!email || !password || !name || !inviteCode) {
      return errorResponse(new Error("Missing required fields"), "register");
    }

    // 1. Validate Invite Code (Throws if invalid/expired/used)
    const invite = await authService.validateInvitation(inviteCode);

    // 2. Create User using Service Role (since they aren't authenticated yet)
    const supabaseAdmin = createServiceRoleClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (authError || !authData.user) {
      return errorResponse(authError || new Error("Failed to create user"), "register");
    }

    const userId = authData.user.id;

    // Wait for the DB trigger to create the profile row (usually instant, but we can do a small delay or upsert)
    // Actually, trigger happens in the same transaction as Auth creation, so it's already there.

    // 3. Update Profile Name explicitly just in case trigger missed it
    await supabaseAdmin
      .from("profiles")
      .update({ name, role: invite.role })
      .eq("id", userId);

    // 4. Consume Invitation (Assigns to store_members)
    await authService.consumeInvitation(inviteCode, userId);

    return successResponse({ userId }, "User registered successfully", 201);
  } catch (error) {
    return errorResponse(error, "register");
  }
}
