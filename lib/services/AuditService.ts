import { AuditRepository, AuditLogDTO } from "../repositories/audit.repository";
import { waitUntil } from "@vercel/functions"; // Ensure this import works, or we mock it for non-vercel

export class AuditService {
  private auditRepository: AuditRepository;

  constructor(auditRepository: AuditRepository) {
    this.auditRepository = auditRepository;
  }

  log(entry: AuditLogDTO) {
    // We use waitUntil (if available in Next.js 14+) to execute this without blocking the response
    // Vercel's Edge/Serverless handles waitUntil natively. 
    // In Node.js, we can fallback to floating promises.
    try {
      import("@vercel/functions").then(({ waitUntil }) => {
        waitUntil(this.auditRepository.log(entry));
      }).catch(() => {
        // Fallback for local dev if vercel functions package fails
        this.auditRepository.log(entry).catch(console.error);
      });
    } catch (e) {
      this.auditRepository.log(entry).catch(console.error);
    }
  }
}
