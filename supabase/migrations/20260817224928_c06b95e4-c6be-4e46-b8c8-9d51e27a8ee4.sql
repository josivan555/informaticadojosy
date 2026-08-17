-- 1. Move SECURITY DEFINER helper out of the exposed API schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

-- Re-point policies to the private helper
DROP POLICY IF EXISTS "Admins can view all download history" ON public.download_history;
CREATE POLICY "Admins can view all download history" ON public.download_history
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage softwares" ON public.softwares;
CREATE POLICY "Admins can manage softwares" ON public.softwares
  FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access software_categories" ON public.software_categories;
CREATE POLICY "Admin full access software_categories" ON public.software_categories
  FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage files" ON storage.objects;
CREATE POLICY "Admins can manage files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'files' AND private.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'files' AND private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin Insert Softwares" ON storage.objects;
CREATE POLICY "Admin Insert Softwares" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('softwares','courses') AND private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin Update Softwares" ON storage.objects;
CREATE POLICY "Admin Update Softwares" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('softwares','courses') AND private.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id IN ('softwares','courses') AND private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin Delete Softwares" ON storage.objects;
CREATE POLICY "Admin Delete Softwares" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('softwares','courses') AND private.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 2. Remove permissive storage write policies
DROP POLICY IF EXISTS "Allow authenticated uploads to softwares" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to softwares" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to courses" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to courses" ON storage.objects;

-- 3. Hide monetization/download fields from public reads
ALTER TABLE public.softwares
  ADD COLUMN IF NOT EXISTS has_purchase_link boolean
    GENERATED ALWAYS AS (mercadopago_link IS NOT NULL OR paddle_price_id IS NOT NULL) STORED,
  ADD COLUMN IF NOT EXISTS has_download boolean
    GENERATED ALWAYS AS (external_download_url IS NOT NULL OR file_url IS NOT NULL) STORED;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS has_purchase_link boolean
    GENERATED ALWAYS AS (mercadopago_link IS NOT NULL OR paddle_price_id IS NOT NULL) STORED,
  ADD COLUMN IF NOT EXISTS has_download boolean
    GENERATED ALWAYS AS (external_download_url IS NOT NULL OR file_url IS NOT NULL) STORED;

REVOKE SELECT ON public.softwares FROM anon, authenticated;
REVOKE SELECT ON public.courses FROM anon, authenticated;

GRANT SELECT (id, name, description, version, size, category, downloads, status,
  created_at, updated_at, price, category_id, image_url, video_url,
  has_purchase_link, has_download) ON public.softwares TO anon, authenticated;

GRANT SELECT (id, title, description, price, pages, level, status,
  created_at, updated_at, image_url, video_url,
  has_purchase_link, has_download) ON public.courses TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.softwares TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.softwares TO service_role;
GRANT ALL ON public.courses TO service_role;