ALTER TABLE public.softwares ADD COLUMN IF NOT EXISTS license_url text;
GRANT SELECT (license_url) ON public.softwares TO anon, authenticated;
GRANT INSERT (license_url), UPDATE (license_url) ON public.softwares TO authenticated;