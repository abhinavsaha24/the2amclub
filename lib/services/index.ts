import { ProductService } from "./ProductService";
import { StoreService } from "./StoreService";
import { StorageService } from "./StorageService";
import { AuditService } from "./AuditService";
import { AuthService } from "./AuthService";
import { AnalyticsService } from "./AnalyticsService";

import { ProductRepository } from "../repositories/products.repository";
import { StoreRepository } from "../repositories/stores.repository";
import { AuditRepository } from "../repositories/audit.repository";

// Repositories
const productRepository = new ProductRepository();
const storeRepository = new StoreRepository();
const auditRepository = new AuditRepository();

// Services
export const storageService = new StorageService();
export const auditService = new AuditService(auditRepository);
export const productService = new ProductService(productRepository, storageService, auditService);
export const storeService = new StoreService(storeRepository, storageService, auditService);
export const authService = new AuthService();
export const analyticsService = new AnalyticsService();
