-- Grant execute on the has_role function to all authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

-- Ensure public access to storage objects for these buckets
-- First drop existing to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access Softwares" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Insert Softwares" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update Softwares" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete Softwares" ON storage.objects;
END $$;

CREATE POLICY "Public Access Softwares" ON storage.objects FOR SELECT USING (bucket_id IN ('softwares', 'courses'));
CREATE POLICY "Admin Insert Softwares" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('softwares', 'courses') AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin Update Softwares" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('softwares', 'courses') AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin Delete Softwares" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('softwares', 'courses') AND public.has_role(auth.uid(), 'admin'));
