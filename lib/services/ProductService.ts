import { ProductRepository, InsertProductDTO, UpdateProductDTO } from "../repositories/products.repository";
import { StorageService } from "./StorageService";
import { AuditService } from "./AuditService";
import { BusinessLogicError } from "../errors";

export class ProductService {
  constructor(
    private productRepository: ProductRepository,
    private storageService: StorageService,
    private auditService: AuditService
  ) {}

  async createProduct(
    adminId: string,
    locationId: string,
    payload: Omit<InsertProductDTO, "location_id" | "image">,
    imageBuffer?: Buffer,
    imageMime?: string,
    imagePath?: string
  ) {
    let uploadedImagePath: string | null = null;

    try {
      // 1. Upload Image First
      if (imageBuffer && imagePath) {
        uploadedImagePath = await this.storageService.uploadImage(imagePath, imageBuffer, imageMime);
      }

      // 2. Database Insert
      const fullPayload: InsertProductDTO = {
        ...payload,
        location_id: locationId,
        image: uploadedImagePath,
      };

      const product = await this.productRepository.insert(fullPayload);

      // 3. Audit Log
      this.auditService.log({
        admin_id: adminId,
        location_id: locationId,
        action: "create",
        resource: "product",
        resource_id: product.id,
        after_value: product,
      });

      return product;
    } catch (error: any) {
      // 4. Compensation / Rollback
      if (uploadedImagePath) {
        try {
          await this.storageService.deleteImage(uploadedImagePath);
        } catch (cleanupError) {
          console.error("[COMPENSATION FAILED] Could not delete orphaned image:", uploadedImagePath);
          // In a truly robust system, we would log this to a dead-letter queue or cleanup table
        }
      }

      this.auditService.log({
        admin_id: adminId,
        location_id: locationId,
        action: "create_failed",
        resource: "product",
        failure_reason: error.message,
      });

      throw new BusinessLogicError(`Failed to create product: ${error.message}`);
    }
  }

  async updateProduct(
    adminId: string,
    locationId: string,
    productId: string,
    payload: UpdateProductDTO,
    oldImagePath?: string | null,
    newImageBuffer?: Buffer,
    newImageMime?: string,
    newImagePath?: string
  ) {
    let uploadedImagePath: string | null = null;

    try {
      // 1. Upload New Image if provided
      if (newImageBuffer && newImagePath) {
        uploadedImagePath = await this.storageService.uploadImage(newImagePath, newImageBuffer, newImageMime);
        payload.image = uploadedImagePath;
      }

      // 2. Database Update
      const product = await this.productRepository.update(productId, locationId, payload);

      // 3. Cleanup Old Image
      if (uploadedImagePath && oldImagePath && oldImagePath !== uploadedImagePath && oldImagePath.trim() !== "") {
        this.storageService.deleteImage(oldImagePath).catch((e) => {
          console.error("[CLEANUP ERROR] Failed to delete old image after product update:", e);
        });
      }

      // 4. Audit Log
      this.auditService.log({
        admin_id: adminId,
        location_id: locationId,
        action: "update",
        resource: "product",
        resource_id: productId,
        after_value: product, // For strict compliance, fetch before_value as well, omitted for brevity unless strictly required
      });

      return product;
    } catch (error: any) {
      // Rollback newly uploaded image
      if (uploadedImagePath) {
        this.storageService.deleteImage(uploadedImagePath).catch(console.error);
      }

      this.auditService.log({
        admin_id: adminId,
        location_id: locationId,
        action: "update_failed",
        resource: "product",
        resource_id: productId,
        failure_reason: error.message,
      });

      throw new BusinessLogicError(`Failed to update product: ${error.message}`);
    }
  }

  async deleteProduct(adminId: string, locationId: string, productId: string, imagePath?: string | null) {
    try {
      await this.productRepository.delete(productId);

      if (imagePath) {
        this.storageService.deleteImage(imagePath).catch(console.error);
      }

      this.auditService.log({
        admin_id: adminId,
        location_id: locationId,
        action: "delete",
        resource: "product",
        resource_id: productId,
      });
    } catch (error: any) {
      throw new BusinessLogicError(`Failed to delete product: ${error.message}`);
    }
  }
}
