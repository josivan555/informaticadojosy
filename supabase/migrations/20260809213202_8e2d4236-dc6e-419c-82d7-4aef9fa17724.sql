-- Re-verify and widen policies for storage.objects
DROP POLICY IF EXISTS "Public Read Softwares Anon" ON storage.objects;

-- Widen to all buckets just for testing, or keep to specific ones but ensure no folders are restricted
CREATE POLICY "Public Read Softwares Anon"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id IN ('softwares', 'courses'));

-- Ensure grants are complete for storage schema
GRANT SELECT ON storage.objects TO anon, authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;
