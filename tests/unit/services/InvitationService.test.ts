import { describe, it, expect, vi, beforeEach } from "vitest";
import { InvitationService } from "@/lib/services/InvitationService";
import { InvitationRepository } from "@/lib/repositories/invitation.repository";

// Mock the repository
vi.mock("@/lib/repositories/invitation.repository");

describe("InvitationService", () => {
  let service: InvitationService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    service = new InvitationService();
  });

  it("should generate a valid 8-character code and insert it", async () => {
    const mockInsert = vi.spyOn(InvitationRepository.prototype, "insert").mockResolvedValue({
      id: "test-id",
      hashed_code: "hash",
      organization_id: "org",
      store_id: "store",
      role: "STAFF",
      creator_id: "creator",
      max_uses: 1,
      used_count: 0,
      expires_at: new Date().toISOString(),
      is_revoked: false,
      created_at: new Date().toISOString()
    });

    const result = await service.createInvitation("org", "store", "STAFF", "creator");

    expect(result.code).toHaveLength(8);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      organization_id: "org",
      store_id: "store",
      role: "STAFF",
      creator_id: "creator",
      max_uses: 1
    }));
  });
});
