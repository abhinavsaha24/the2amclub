import { ProductRepository } from "../repositories/products.repository";
import { LocationRepository } from "../repositories/locations.repository";
import { AuditRepository } from "../repositories/audit.repository";

import { StorageService } from "./StorageService";
import { AuditService } from "./AuditService";
import { ProductService } from "./ProductService";

import { LocationService } from "./LocationService";

// Repositories
const productRepository = new ProductRepository();
const locationRepository = new LocationRepository();
const auditRepository = new AuditRepository();

// Services
export const storageService = new StorageService();
export const auditService = new AuditService(auditRepository);
export const productService = new ProductService(
  productRepository,
  storageService,
  auditService
);
export const locationService = new LocationService(
  locationRepository,
  storageService,
  auditService
);
