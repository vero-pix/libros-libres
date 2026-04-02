-- Ejecutar en Supabase Dashboard → SQL Editor
-- Agrega columnas faltantes a tablas existentes

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
