import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductService } from "@/lib/services/ProductService";
import { ProductRepository } from "@/lib/repositories/products.repository";
import { StorageService } from "@/lib/services/StorageService";
import { AuditService } from "@/lib/services/AuditService";

describe("ProductService", () => {
  let productService: ProductService;
  let mockProductRepo: any;
  let mockStorageService: any;
  let mockAuditService: any;

  beforeEach(() => {
    mockProductRepo = {
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    mockStorageService = {
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };
    mockAuditService = {
      log: vi.fn(),
    };

    productService = new ProductService(
      mockProductRepo as unknown as ProductRepository,
      mockStorageService as unknown as StorageService,
      mockAuditService as unknown as AuditService
    );
  });

  it("should create a product successfully without image", async () => {
    mockProductRepo.insert.mockResolvedValue({ id: "prod-1", name: "Test" });

    const result = await productService.createProduct("admin-1", "loc-1", {
      name: "Test",
      price: 10,
      stock: 5,
      category: "Snacks",
      is_active: true,
    });

    expect(result.id).toBe("prod-1");
    expect(mockProductRepo.insert).toHaveBeenCalledWith(expect.objectContaining({ name: "Test", location_id: "loc-1" }));
    expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: "create", resource: "product" }));
  });

  it("should upload image and save product", async () => {
    mockStorageService.uploadImage.mockResolvedValue("path/to/image.webp");
    mockProductRepo.insert.mockResolvedValue({ id: "prod-2", image: "path/to/image.webp" });

    const result = await productService.createProduct(
      "admin-1",
      "loc-1",
      { name: "Test 2", price: 10, stock: 5, category: "Snacks", is_active: true },
      Buffer.from("fake"),
      "image/webp",
      "loc-1/products/uuid.webp"
    );

    expect(mockStorageService.uploadImage).toHaveBeenCalled();
    expect(mockProductRepo.insert).toHaveBeenCalledWith(expect.objectContaining({ image: "path/to/image.webp" }));
  });

  it("should rollback image upload if database fails", async () => {
    mockStorageService.uploadImage.mockResolvedValue("path/to/image.webp");
    mockProductRepo.insert.mockRejectedValue(new Error("DB Error"));

    await expect(
      productService.createProduct(
        "admin-1",
        "loc-1",
        { name: "Fail", price: 10, stock: 5, category: "Snacks", is_active: true },
        Buffer.from("fake"),
        "image/webp",
        "path.webp"
      )
    ).rejects.toThrow("Failed to create product");

    expect(mockStorageService.deleteImage).toHaveBeenCalledWith("path/to/image.webp");
    expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: "create_failed" }));
  });
});
