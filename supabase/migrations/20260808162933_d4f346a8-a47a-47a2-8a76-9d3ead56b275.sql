-- Add video_url column to softwares table
ALTER TABLE public.softwares ADD COLUMN IF NOT EXISTS video_url text;

-- Ensure grants are correct for the modified table
GRANT ALL ON public.softwares TO authenticated;
GRANT ALL ON public.softwares TO service_role;
GRANT SELECT ON public.softwares TO anon;
