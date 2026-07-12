import { BaseRepository } from "./base.repository";
import { DatabaseError } from "../errors";

export interface AuditLogDTO {
  admin_id?: string;
  location_id?: string;
  action: string;
  resource: string;
  resource_id?: string;
  before_value?: any;
  after_value?: any;
  ip_address?: string;
  user_agent?: string;
  success?: boolean;
  failure_reason?: string;
}

export class AuditRepository extends BaseRepository<any> {
  constructor() {
    super("audit_logs");
  }

  async log(entry: AuditLogDTO): Promise<void> {
    // Audit logs should be fire-and-forget in most cases, 
    // but we await here to ensure it's written before functions terminate if needed.
    const { error } = await this.client
      .from(this.tableName)
      .insert(entry);

    if (error) {
      console.error("[AUDIT LOG ERROR]", error);
      // We explicitly DO NOT throw a DatabaseError here. 
      // Audit log failures should not break the main business logic flow.
    }
  }
}
