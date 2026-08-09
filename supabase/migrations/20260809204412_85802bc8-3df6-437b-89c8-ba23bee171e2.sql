-- 1. Definitively set informaticadojosy@gmail.com as admin
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'informaticadojosy@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Insert or update role to admin
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO UPDATE SET role = 'admin';
    END IF;
END $$;

-- 2. Ensure has_role is usable by the API but restricted in its check
-- We already have the SECURITY DEFINER function, but let's make sure execute permissions are set correctly
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- 3. Fix Storage Policies (the 400 error often means policy denied or bucket missing)
-- Since I just created the buckets, let's ensure the policies are broad enough for admin operations
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access Softwares" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Insert Softwares" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update Softwares" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete Softwares" ON storage.objects;
END $$;

-- Allow public read access to softwares and courses buckets
CREATE POLICY "Public Read Softwares" ON storage.objects FOR SELECT USING (bucket_id IN ('softwares', 'courses'));

-- Allow admins full control
CREATE POLICY "Admin Insert Softwares" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('softwares', 'courses') AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin Update Softwares" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('softwares', 'courses') AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin Delete Softwares" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('softwares', 'courses') AND public.has_role(auth.uid(), 'admin'));

-- 4. Final check on table grants for the 403 errors
GRANT ALL ON public.softwares TO authenticated;
GRANT ALL ON public.courses TO authenticated;
GRANT ALL ON public.software_categories TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.softwares TO service_role;
GRANT ALL ON public.courses TO service_role;
GRANT ALL ON public.software_categories TO service_role;
GRANT ALL ON public.user_roles TO service_role;
