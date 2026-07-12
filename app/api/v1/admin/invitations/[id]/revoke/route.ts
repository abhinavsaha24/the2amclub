import { NextRequest } from "next/server";
import { withStoreAdminApiHandler, successResponse } from "@/lib/utils/api";
import { InvitationService } from "@/lib/services/InvitationService";

export const PATCH = withStoreAdminApiHandler(
  "revoke_invitation",
  async (_req: NextRequest, ctx, _requestId, { params }: { params: { id: string } }) => {
    // Await params if Next 15, but Next 14 doesn't require it technically, 
    // although App Router standardizes on awaiting params eventually.
    // For Next 14, params can be used directly, but let's safely handle it.
    const id = params.id;
    
    const service = new InvitationService();
    await service.revokeInvitation(id, ctx.storeId);
    
    return successResponse({ success: true }, "Invitation revoked successfully");
  }
);
