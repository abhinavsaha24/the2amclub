import { StoreRepository, UpdateStoreDTO } from "../repositories/stores.repository";
import { StorageService } from "./StorageService";
import { AuditService } from "./AuditService";
import { BusinessLogicError } from "../errors";
import { logger } from "../logger";

export class StoreService {
  constructor(
    private storeRepository: StoreRepository,
    private storageService: StorageService,
    private auditService: AuditService
  ) {}

  async updateSettings(
    adminId: string,
    organizationId: string,
    storeId: string,
    payload: UpdateStoreDTO,
    qrBuffer?: Buffer,
    qrMime?: string,
    qrPath?: string,
    oldQrPath?: string | null
  ) {
    let uploadedQrPath: string | null = null;

    try {
      if (qrBuffer && qrPath) {
        uploadedQrPath = await this.storageService.uploadImage(qrPath, qrBuffer, qrMime);
        payload.qr_code = uploadedQrPath;
      }

      const store = await this.storeRepository.update(storeId, organizationId, payload);

      if (uploadedQrPath && oldQrPath) {
        this.storageService.deleteImage(oldQrPath).catch((e) => {
          logger.error({ action: "cleanup_old_qr", error: e, oldQr: oldQrPath });
        });
      }

      this.auditService.log({
        organization_id: organizationId,
        store_id: storeId,
        user_id: adminId,
        action: "update_settings",
        resource: "store",
        resource_id: store.id,
        after_value: store,
      });

      return store;
    } catch (e: any) {
      if (uploadedQrPath) {
        this.storageService.deleteImage(uploadedQrPath).catch((e) => logger.error({ action: "delete_orphaned_qr", error: e }));
      }
      throw new BusinessLogicError("Failed to update store settings: " + e.message);
    }
  }
}
