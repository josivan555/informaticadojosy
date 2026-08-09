-- Redefine storage policy to be less restrictive for public access to covers
DROP POLICY IF EXISTS "Public Read Softwares Anon" ON storage.objects;

CREATE POLICY "Public Read Softwares Anon"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id IN ('softwares', 'courses')
);

-- Ensure all necessary grants are present for storage
GRANT SELECT ON storage.objects TO anon, authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;

-- Ensure public access to the softwares and courses tables
GRANT SELECT ON public.softwares TO anon, authenticated;
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT SELECT ON public.software_categories TO anon, authenticated;
