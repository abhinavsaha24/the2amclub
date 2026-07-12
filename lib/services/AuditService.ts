import { AuditRepository, CreateAuditLogDTO } from "../repositories/audit.repository";
import { waitUntil } from "@vercel/functions";
import { headers } from "next/headers";

export class AuditService {
  constructor(private auditRepository: AuditRepository) {}

  /**
   * Fire-and-forget audit logger.
   * Utilizes waitUntil to prevent blocking the main request response loop.
   */
  log(payload: Omit<CreateAuditLogDTO, "ip_address" | "user_agent">) {
    const safeExecute = async () => {
      try {
        const reqHeaders = await headers();
        const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || null;
        const ua = reqHeaders.get("user-agent") || null;

        await this.auditRepository.insert({
          ...payload,
          ip_address: ip,
          user_agent: ua,
        });
      } catch (e) {
        // We still use console.error here as a fallback because logger might trigger another audit
        console.error("[AUDIT FAILURE] Failed to write audit log:", e);
      }
    };

    waitUntil(safeExecute());
  }
}
