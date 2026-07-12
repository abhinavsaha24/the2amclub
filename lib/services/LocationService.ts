import { LocationRepository, UpdateLocationDTO } from "../repositories/locations.repository";
import { StorageService } from "./StorageService";
import { AuditService } from "./AuditService";
import { BusinessLogicError } from "../errors";

export class LocationService {
  constructor(
    private locationRepository: LocationRepository,
    private storageService: StorageService,
    private auditService: AuditService
  ) {}

  async updateSettings(
    adminId: string,
    locationId: string,
    payload: UpdateLocationDTO,
    oldQrPath?: string | null,
    newQrBuffer?: Buffer,
    newQrMime?: string,
    newQrPath?: string
  ) {
    let uploadedQrPath: string | null = null;

    try {
      if (newQrBuffer && newQrPath) {
        uploadedQrPath = await this.storageService.uploadImage(newQrPath, newQrBuffer, newQrMime);
        payload.upi_qr_image = uploadedQrPath;
      }

      const location = await this.locationRepository.update(locationId, payload);

      if (uploadedQrPath && oldQrPath && oldQrPath !== uploadedQrPath && oldQrPath.trim() !== "") {
        this.storageService.deleteImage(oldQrPath).catch((e) => {
          console.error("[CLEANUP ERROR] Failed to delete old QR code:", e);
        });
      }

      this.auditService.log({
        admin_id: adminId,
        location_id: locationId,
        action: "update_settings",
        resource: "location",
        resource_id: locationId,
        after_value: location,
      });

      return location;
    } catch (error: any) {
      if (uploadedQrPath) {
        this.storageService.deleteImage(uploadedQrPath).catch(console.error);
      }

      this.auditService.log({
        admin_id: adminId,
        location_id: locationId,
        action: "update_settings_failed",
        resource: "location",
        resource_id: locationId,
        failure_reason: error.message,
      });

      throw new BusinessLogicError(`Failed to update settings: ${error.message}`);
    }
  }
}
