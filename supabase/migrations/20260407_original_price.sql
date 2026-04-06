ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2) CHECK (original_price IS NULL OR original_price >= 0);
