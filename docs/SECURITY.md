# Security Overview

## 1. Authentication
- Custom cookie-based authentication via `admin_code`.
- Future migration path available to Supabase Auth.
- No sensitive data exposed in client-side bundles.

## 2. API Security
- **Data Validation:** Strict input validation via `zod`.
- **Error Handling:** Standardized error wrapping via `lib/utils/api.ts` ensures internal SQL/V8 stack traces never leak to the client.
- **Role-based Access:** Only `admin_session` can mutate products/settings.

## 3. Storage Security
- `product-images` bucket is Public for reads.
- Uploads happen strictly via backend Next.js API using `SUPABASE_SERVICE_ROLE_KEY`.
- No client-side uploads allowed.
- Images are strictly limited to 2MB and resized to 1600px via `sharp` which strips EXIF metadata.

## 4. Audit Logging
- Every mutation (create/update/delete) is logged to the `audit_logs` table asynchronously for tracking admin activity.
