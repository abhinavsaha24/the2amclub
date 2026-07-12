import { ProductRepository, InsertProductDTO, UpdateProductDTO } from "../repositories/products.repository";
import { StorageService } from "./StorageService";
import { AuditService } from "./AuditService";
import { BusinessLogicError } from "../errors";
import { logger } from "../logger";

export class ProductService {
  constructor(
    private productRepository: ProductRepository,
    private storageService: StorageService,
    private auditService: AuditService
  ) {}

  async createProduct(
    adminId: string,
    organizationId: string,
    storeId: string,
    payload: Omit<InsertProductDTO, "organization_id" | "store_id" | "image">,
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
        organization_id: organizationId,
        store_id: storeId,
        image: uploadedImagePath,
      };

      const product = await this.productRepository.insert(fullPayload);

      // 3. Audit Log
      this.auditService.log({
        organization_id: organizationId,
        store_id: storeId,
        user_id: adminId,
        action: "create",
        resource: "product",
        resource_id: product.id,
        after_value: product,
      });

      return product;
    } catch (e: any) {
      // 4. Compensating Transaction (Rollback Image)
      if (uploadedImagePath) {
        this.storageService.deleteImage(uploadedImagePath).catch((error) => {
          logger.error({ action: "cleanup_orphaned_image", error, uploadedImagePath });
        });
      }

      this.auditService.log({
        organization_id: organizationId,
        store_id: storeId,
        user_id: adminId,
        action: "create_failed",
        resource: "product",
        failure_reason: e.message,
      });

      throw new BusinessLogicError("Failed to create product: " + e.message);
    }
  }

  async updateProduct(
    adminId: string,
    organizationId: string,
    storeId: string,
    productId: string,
    payload: UpdateProductDTO,
    newImageBuffer?: Buffer,
    newImageMime?: string,
    newImagePath?: string,
    oldImagePath?: string | null
  ) {
    let uploadedImagePath: string | null = null;

    try {
      if (newImageBuffer && newImagePath) {
        uploadedImagePath = await this.storageService.uploadImage(newImagePath, newImageBuffer, newImageMime);
        payload.image = uploadedImagePath;
      }

      const product = await this.productRepository.update(productId, organizationId, storeId, payload);

      if (uploadedImagePath && oldImagePath) {
        this.storageService.deleteImage(oldImagePath).catch((e) => {
          logger.error({ action: "cleanup_old_image", error: e, oldImage: oldImagePath });
        });
      }

      this.auditService.log({
        organization_id: organizationId,
        store_id: storeId,
        user_id: adminId,
        action: "update",
        resource: "product",
        resource_id: product.id,
        after_value: product,
      });

      return product;
    } catch (e: any) {
      if (uploadedImagePath) {
        this.storageService.deleteImage(uploadedImagePath).catch((e) => logger.error({ action: "delete_orphaned_image", error: e }));
      }
      throw new BusinessLogicError("Failed to update product: " + e.message);
    }
  }

  async deleteProduct(adminId: string, organizationId: string, storeId: string, productId: string, imagePath?: string | null) {
    try {
      await this.productRepository.delete(productId, organizationId, storeId);

      if (imagePath) {
        this.storageService.deleteImage(imagePath).catch((e) => logger.error({ action: "delete_product_image", error: e }));
      }

      this.auditService.log({
        organization_id: organizationId,
        store_id: storeId,
        user_id: adminId,
        action: "delete",
        resource: "product",
        resource_id: productId,
      });
    } catch (e: any) {
      throw new BusinessLogicError("Failed to delete product: " + e.message);
    }
  }
}
