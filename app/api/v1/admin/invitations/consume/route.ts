import { NextRequest } from "next/server";
import { withAuthApiHandler, successResponse } from "@/lib/utils/api";
import { InvitationService } from "@/lib/services/InvitationService";
import { z } from "zod";

const consumeInvitationSchema = z.object({
  code: z.string().min(1, "Invitation code is required"),
});

export const POST = withAuthApiHandler(
  "consume_invitation",
  async (req: NextRequest, userId: string) => {
    const body = await req.json();
    const parsed = consumeInvitationSchema.parse(body);

    const service = new InvitationService();
    const result = await service.consumeInvitation(parsed.code, userId);

    return successResponse(result, "Successfully joined store", 200);
  }
);
