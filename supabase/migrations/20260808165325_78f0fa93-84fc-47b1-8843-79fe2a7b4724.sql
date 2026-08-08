ALTER TABLE public.softwares ADD COLUMN IF NOT EXISTS external_download_url TEXT;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.softwares TO authenticated;
GRANT ALL ON public.softwares TO service_role;
GRANT SELECT ON public.softwares TO anon;