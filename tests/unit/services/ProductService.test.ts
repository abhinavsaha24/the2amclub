import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductService } from "@/lib/services/ProductService";
import { ProductRepository } from "@/lib/repositories/products.repository";
import { StorageService } from "@/lib/services/StorageService";
import { AuditService } from "@/lib/services/AuditService";

vi.mock("@/lib/repositories/products.repository");
vi.mock("@/lib/services/StorageService");
vi.mock("@/lib/services/AuditService");

describe("ProductService", () => {
  let service: ProductService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    const productRepo = new ProductRepository();
    const storageService = new StorageService();
    const auditRepo = new (vi.fn() as any)();
    const auditService = new AuditService(auditRepo);
    service = new ProductService(productRepo, storageService, auditService);
  });

  it("should create a product successfully", async () => {
    const mockInsert = vi.spyOn(ProductRepository.prototype, "insert").mockResolvedValue({
      id: "prod-1",
      organization_id: "org-1",
      store_id: "store-1",
      name: "Test",
      category: "Test",
      description: null,
      price: 10,
      image: null,
      stock: 10,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const mockAudit = vi.spyOn(AuditService.prototype, "log").mockResolvedValue();

    const result = await service.createProduct(
      "user-1",
      "org-1",
      "store-1",
      {
        name: "Test",
        category: "Test",
        price: 10,
        stock: 10,
        is_active: true,
      }
    );

    expect(result.id).toBe("prod-1");
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockAudit).toHaveBeenCalledTimes(1);
  });
});
