ALTER TABLE public.softwares ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.softwares ADD COLUMN IF NOT EXISTS paddle_product_id TEXT;
ALTER TABLE public.softwares ADD COLUMN IF NOT EXISTS paddle_price_id TEXT;
ALTER TABLE public.softwares ADD COLUMN IF NOT EXISTS mercadopago_link TEXT;