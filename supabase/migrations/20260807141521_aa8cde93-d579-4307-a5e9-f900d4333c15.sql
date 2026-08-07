ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS mercadopago_link TEXT;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;