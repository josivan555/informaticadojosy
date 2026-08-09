-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Public Read Softwares Anon" ON storage.objects;

-- Create policy for public access to covers in softwares and courses buckets
CREATE POLICY "Public Read Softwares Anon"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id IN ('softwares', 'courses') AND 
  (storage.foldername(name))[1] = 'covers'
);

-- Ensure anon and authenticated have select access on storage.objects
GRANT SELECT ON storage.objects TO anon, authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;
