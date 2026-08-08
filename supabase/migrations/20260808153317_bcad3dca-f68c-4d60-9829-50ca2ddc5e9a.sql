-- 1. Storage: remove blanket public read of the 'files' bucket
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;

-- Only cover images remain publicly readable
CREATE POLICY "Public can view cover images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'files' AND name LIKE 'covers/%' );

-- 2. user_roles: restrict reads
DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING ( auth.uid() = user_id );

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING ( public.has_role(auth.uid(), 'admin') );