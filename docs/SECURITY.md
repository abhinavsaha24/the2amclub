# Security Architecture

The 2AM Club enforces strict defense-in-depth security principles.

## 1. Authentication & Sessions
- Powered exclusively by `@supabase/ssr`.
- Cookies are `HttpOnly`, `Secure`, and `SameSite=Lax`.
- Users cannot manually bypass JWT checks; middleware verifies sessions for every `/api/v1/admin` request.

## 2. Multi-Tenant Authorization
- **No IDOR (Insecure Direct Object Reference)**: Every backend operation (e.g., `ProductService.updateProduct`) absolutely requires the authenticated user's `store_id` and `organization_id` injected automatically by the `withStoreAdminApiHandler`. 
- Trusting client-side IDs is prohibited.

## 3. Database Security
- **Row Level Security (RLS)** is enabled on all tables (`stores`, `products`, `orders`). 
- Queries inherently filter out cross-tenant data. 

## 4. Input & File Validation
- **Zod Validation**: All requests are rigorously validated through shared `Zod` schemas.
- **Upload Hardening**: The Storage API strips EXIF data, forces `.webp` conversion via `sharp`, and strictly limits image dimensions to 1600px width.

## 5. Security Headers
The following headers are enforced via `next.config.ts`:
- `Content-Security-Policy`: Disallows untrusted scripts and restricts iframes to Stripe.
- `Strict-Transport-Security`: HSTS ensures all traffic forces HTTPS.
- `X-Frame-Options: DENY`: Mitigates clickjacking.
- `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing.
