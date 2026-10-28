-- Security fix: post-images let ANY authenticated user delete ANY object in the
-- bucket ("Own delete post-images" only checked auth.role()), and uploads to
-- post-images / profile-photos weren't confined to the uploader's folder.
-- The app only ever writes images/<uid>/... (post-images) and <uid>/...
-- (profile-photos); all existing objects already follow that layout
-- (checked on production 2026-10-28), so this changes nothing for real use.
-- Server-side cleanup (delete-account, purge-draft-images) uses the service
-- role and is unaffected.
--
-- Idempotent: DROP POLICY IF EXISTS + CREATE.

DROP POLICY IF EXISTS "Own delete post-images" ON storage.objects;
CREATE POLICY "Own delete post-images" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = 'images'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Auth upload post-images" ON storage.objects;
CREATE POLICY "Auth upload post-images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = 'images'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Auth upload" ON storage.objects;
CREATE POLICY "Auth upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
