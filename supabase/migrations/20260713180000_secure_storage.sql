-- ============================================================
-- The 2AM Club - Secure Storage Migration
-- ============================================================
-- Drops the insecure "Auth Manage Images" policy.
-- Enforces Service Role-only uploads.
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '▶️ Securing Storage Bucket...';
  
  -- Drop insecure policy that allowed any authenticated user to upload
  DROP POLICY IF EXISTS "Auth Manage Images" ON storage.objects;

  -- Ensure public read policy remains intact
  DROP POLICY IF EXISTS "Public Read Images" ON storage.objects;
  CREATE POLICY "Public Read Images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

  -- Notice: We do NOT create an INSERT/UPDATE/DELETE policy.
  -- By omitting it, RLS blocks all write access from the browser.
  -- Only the Service Role (which bypasses RLS completely) can upload/delete via the /api/admin/upload route.
  
  RAISE NOTICE '✅ Storage Bucket secured. Service Role uploads only.';
END $$;
