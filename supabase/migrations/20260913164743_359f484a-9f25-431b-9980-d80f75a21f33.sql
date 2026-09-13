ALTER TABLE public.softwares ADD COLUMN IF NOT EXISTS video_urls text[] NOT NULL DEFAULT '{}';
GRANT SELECT (video_urls) ON public.softwares TO anon, authenticated;
GRANT INSERT (video_urls), UPDATE (video_urls) ON public.softwares TO authenticated;
GRANT ALL ON public.softwares TO service_role;