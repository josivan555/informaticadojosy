ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS external_download_url TEXT;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
GRANT SELECT ON public.courses TO anon;