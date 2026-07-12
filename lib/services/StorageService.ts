import { createClient } from "../supabase/server";
import { StorageBuckets } from "../constants";
import { StorageError } from "../errors";
import { logger } from "../logger";

export class StorageService {
  private async getClient() {
    return await createClient();
  }

  async uploadImage(path: string, buffer: Buffer, mimeType: string = "image/webp"): Promise<string> {
    const client = await this.getClient();
    const { data, error } = await client.storage
      .from(StorageBuckets.PRODUCT_IMAGES)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      throw new StorageError(`Failed to upload image: ${error.message}`);
    }

    return data.path;
  }

  async deleteImage(path: string): Promise<void> {
    if (!path) return;
    
    let storagePath = path;
    const match = path.match(/\/public\/product-images\/(.+)$/);
    if (match && match[1]) {
      storagePath = match[1];
    }

    const client = await this.getClient();
    const { error } = await client.storage
      .from(StorageBuckets.PRODUCT_IMAGES)
      .remove([storagePath]);
      
    if (error) {
      // In a StorageService, failing to delete might be swallowed or re-thrown depending on context.
      // Usually, we throw so the orchestrator can decide.
      throw new StorageError(`Failed to delete image at ${storagePath}: ${error.message}`);
    }
  }

  async replaceImage(oldPath: string | null, newPath: string, buffer: Buffer, mimeType: string = "image/webp"): Promise<string> {
    const path = await this.uploadImage(newPath, buffer, mimeType);

    if (oldPath && oldPath !== newPath && oldPath.trim() !== "") {
      try {
        await this.deleteImage(oldPath);
      } catch (err) {
        // Log it, but don't fail the replace operation just because cleanup failed
        logger.error({ action: "storage_cleanup", error: err, bucket: StorageBuckets.PRODUCT_IMAGES, path: oldPath });
      }
    }

    return path;
  }
}
