# The 2AM Club (V4 Production)

The 2AM Club is a highly-scalable, multi-tenant SaaS platform built for college campus delivery services (hostels, libraries, etc.). 

It supports hundreds of organizations and thousands of stores with absolute data isolation via Postgres Row Level Security (RLS) and Supabase Auth.

## Architecture Highlights
- **Framework**: Next.js 14 App Router
- **Database**: Supabase PostgreSQL
- **Auth**: `@supabase/ssr` with Role-Based Access Control
- **Styling**: Tailwind CSS & Framer Motion
- **Tenancy**: Multi-tenant via `organization_id` & `store_id` boundaries.
- **Background Jobs**: Vercel `@vercel/functions` `waitUntil()` for compensating transactions.

## Security Posture
- 100% Data Isolation at the database level.
- Strict `Content-Security-Policy` and `HSTS` headers.
- Middleware protection against unauthorized API access (`withStoreAdminApiHandler`).
- Image processing (stripping EXIF) before uploading to S3 buckets.

## Development Setup

1. Copy `.env.example` to `.env.local`
2. Populate the Supabase credentials.
3. Run `npm install`
4. Run `npm run type-check` to validate `env` structure.
5. Run `npm run dev`

## Deployment (Vercel)
The project is configured for seamless Vercel deployment. Refer to [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for environment variables and branch protections.
