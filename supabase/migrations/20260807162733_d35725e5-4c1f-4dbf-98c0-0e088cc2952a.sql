ALTER TABLE public.softwares ADD COLUMN IF NOT EXISTS image_url text;

-- No need for GRANTs since it's an existing table and roles already have access to public.softwares.
-- But just in case, re-apply for safety as per instructions.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.softwares TO authenticated;
GRANT ALL ON public.softwares TO service_role;
GRANT SELECT ON public.softwares TO anon;