# Changelog

All notable changes to this project will be documented in this file.

## [v1.0.0] - RC1 Release

### Added
- Complete backend rewrite utilizing Domain-Driven Design (DDD).
- Service Layer (`ProductService`, `LocationService`, `StorageService`, `AuditService`).
- Repository Layer abstracting all Supabase PostgreSQL interactions.
- Strict `zod` schema validation for all incoming API payloads and Form state.
- Automated `audit_logs` tracking for all data mutations via Next.js `waitUntil()`.
- Standardized API Response Wrapping intercepting errors gracefully.
- Idempotent `schema_v3.sql` supporting auto-provisioning of buckets and tables.

### Changed
- Replaced frontend Supabase mutations with strictly validated backend APIs.
- Integrated `react-hook-form` into the Product and Settings pages.
- Enforced compensating transactions (Sagas) ensuring storage is purged if a database save fails.
- Switched image processing to edge-safe `sharp` rendering strict WebP formats at 1600px width.

### Removed
- Deprecated client-side upload functionality.
- Removed unused dependencies and duplicate storage utilities.
