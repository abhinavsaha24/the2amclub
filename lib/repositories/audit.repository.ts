import { BaseRepository } from "./base.repository";
import { DatabaseError } from "../errors";

export interface CreateAuditLogDTO {
  organization_id?: string | null;
  store_id?: string | null;
  user_id?: string | null;
  action: string;
  resource: string;
  resource_id?: string | null;
  before_value?: any;
  after_value?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  success?: boolean;
  failure_reason?: string | null;
}

export class AuditRepository extends BaseRepository<any> {
  constructor() {
    super("audit_logs");
  }

  async insert(log: CreateAuditLogDTO): Promise<void> {
    const client = await this.getClient();
    const { error } = await client.from(this.tableName).insert(log);
    
    if (error) {
      throw new DatabaseError(`Failed to insert audit log: ${error.message}`);
    }
  }
}
