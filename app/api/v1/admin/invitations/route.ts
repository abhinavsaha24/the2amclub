import { NextRequest } from "next/server";
import { withStoreAdminApiHandler, successResponse } from "@/lib/utils/api";
import { InvitationService } from "@/lib/services/InvitationService";
import { z } from "zod";

const createInvitationSchema = z.object({
  role: z.enum(["STORE_OWNER", "STORE_MANAGER", "STAFF"]),
  maxUses: z.number().min(1).max(100).default(1),
  expiresInDays: z.number().min(1).max(30).default(7),
});

export const GET = withStoreAdminApiHandler(
  "list_invitations",
  async (_req: NextRequest, ctx) => {
    const service = new InvitationService();
    const invitations = await service.getInvitations(ctx.storeId);
    return successResponse(invitations);
  }
);

export const POST = withStoreAdminApiHandler(
  "create_invitation",
  async (req: NextRequest, ctx) => {
    const body = await req.json();
    const parsed = createInvitationSchema.parse(body);

    const service = new InvitationService();
    const result = await service.createInvitation(
      ctx.organizationId,
      ctx.storeId,
      parsed.role,
      ctx.userId,
      parsed.maxUses,
      parsed.expiresInDays
    );

    return successResponse(result, "Invitation created successfully", 201);
  }
);
