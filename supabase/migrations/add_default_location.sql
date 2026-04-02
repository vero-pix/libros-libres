-- Ejecutar en Supabase Dashboard → SQL Editor
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS default_latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS default_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS default_address   TEXT;
