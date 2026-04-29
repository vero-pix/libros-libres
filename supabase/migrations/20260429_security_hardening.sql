-- ============================================================
-- Security Hardening — 2026-04-29
-- Fixes 4 Supabase Security Advisor warnings:
-- 1. handle_new_user callable by anon via REST API
-- 2. is_admin callable by anon via REST API
-- 3. set_updated_at has mutable search_path
-- 4. listings_within_radius has mutable search_path
-- ============================================================

-- 1. Revoke public/anon EXECUTE on handle_new_user
-- This function is a trigger, not an API endpoint.
-- It should never be callable directly via /rest/v1/rpc/
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- 2. Revoke public/anon EXECUTE on is_admin
-- is_admin is used internally by RLS policies only.
-- Calling it directly via REST leaks whether the current user is admin.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated, public;

-- 3. Fix search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. Fix search_path on listings_within_radius
CREATE OR REPLACE FUNCTION public.listings_within_radius(
  lat       double precision,
  lng       double precision,
  radius_km double precision DEFAULT 10
)
RETURNS SETOF public.listings
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT *
  FROM public.listings
  WHERE status = 'active'
    AND location IS NOT NULL
    AND st_dwithin(
      location::geography,
      st_setsrid(st_makepoint(lng, lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY location <-> st_setsrid(st_makepoint(lng, lat), 4326)::geography;
$$;

-- 5. Fix search_path on is_admin (recreate to add SET search_path)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Re-revoke after recreating (CREATE OR REPLACE resets grants)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated, public;

-- Grant back to authenticated only (needed by RLS policies)
-- RLS policies run as the row owner via SECURITY DEFINER, not via REST.
-- No explicit grant needed for trigger/RLS internal calls.
