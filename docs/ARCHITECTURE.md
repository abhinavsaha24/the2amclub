# The 2AM Club Architecture v4 (Multi-Tenant SaaS)

## System Overview

The 2AM Club is a multi-tenant SaaS platform built on Next.js, Supabase, and Tailwind CSS. It is designed to serve multiple organizations (colleges, universities) and multiple stores (hostel canteens, libraries) under one platform.

## Architecture Tiers

### 1. Presentation Layer (Frontend)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Framer Motion
- **Roles**:
  - `Customer (Public)`: Browses stores, views products, places orders.
  - `Store Admin`: Manages a specific store's catalog, settings, and orders.
  - `Super Admin`: Platform owner managing all organizations and stores.

### 2. Business Logic Layer (Services)
- **Location**: `lib/services/*`
- **Pattern**: Dependency Injection (DI)
- **Services**:
  - `AuthService`: Manages invitation codes, user roles, and registration flows.
  - `StoreService`: Scopes all operations (settings, QR codes) strictly by `organization_id` + `store_id`.
  - `ProductService`: Enforces tenant boundary for product lifecycle (Create/Update/Delete).
  - `AnalyticsService`: Aggregates metrics at the platform, organization, and store levels.
  - `StorageService`: Handles idempotent asset uploading with background compensation logic on failure.

### 3. Data Access Layer (Repositories)
- **Location**: `lib/repositories/*`
- **Pattern**: Generic Repository Pattern
- **Responsibilities**: Centralized database interactions using Supabase clients, preventing direct API calls in route handlers. 

### 4. Database Layer (Supabase / PostgreSQL)
- **Core Entities**:
  - `organizations`: Top-level tenant (e.g., Thapar University).
  - `stores`: Granular tenant under an organization (e.g., Hostel A Canteen).
  - `profiles`: Tied 1:1 with `auth.users` via database trigger.
  - `store_members`: Maps a `profile` to a `store` with a specific role.
  - `invitations`: Single-use codes mapped to roles and stores.
- **Security**: Strict Row Level Security (RLS) guarantees that `products`, `orders`, and `settings` are isolated by `organization_id` and `store_id`.

## Authentication & Authorization
- **Authentication**: Delegated entirely to Supabase Auth (`@supabase/ssr`).
- **Authorization**: 
  - APIs validate headers (`x-store-id`) against the database.
  - `withStoreAdminApiHandler` wrapper strictly guarantees that the authenticated user belongs to `store_members` for the requested store.
- **Roles**: `SUPER_ADMIN`, `STORE_OWNER`, `STORE_MANAGER`, `STAFF`.

## Edge & Background Processing
- Uses Vercel's `waitUntil` for non-critical compensating transactions (e.g., audit logging, orphaned image cleanup).

---
*Generated during V4 Release.*
