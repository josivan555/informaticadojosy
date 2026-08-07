ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS paddle_product_id TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS paddle_price_id TEXT;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;