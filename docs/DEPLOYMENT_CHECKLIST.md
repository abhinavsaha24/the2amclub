# Production Deployment Checklist

## 1. Security & Infrastructure
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel.
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel (Critical for Storage APIs).
- [ ] Ensure `NODE_ENV=production`.
- [ ] Enable Vercel Web Analytics.
- [ ] Run `npm run build` locally to verify zero TS errors.

## 2. Database
- [ ] Run `schema_v3.sql` in the Supabase SQL Editor.
- [ ] Verify `audit_logs` table exists.
- [ ] Verify `product-images` bucket exists and is Public.
- [ ] Check Supabase PITR (Point-in-Time Recovery) is enabled (Pro plan).

## 3. Storage
- [ ] Upload a test image.
- [ ] Verify 2MB size limit blocks large uploads.
- [ ] Verify unsupported mime types are blocked.
- [ ] Delete test image and verify bucket is empty.

## 4. Frontend & SEO
- [ ] Check Lighthouse score (Target >95).
- [ ] Verify robots.txt and sitemap (if applicable).
- [ ] Test PWA installation on iOS and Android.

## 5. End-to-End
- [ ] Run `npm run test` (Vitest) successfully.
- [ ] Complete 1 full order cycle as a customer.
- [ ] Complete 1 full product lifecycle (Create -> Edit -> Delete) as admin.
