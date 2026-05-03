-- Fix RLS policies that call public.is_admin().
--
-- 20260429_security_hardening revoked EXECUTE from authenticated, which blocks
-- policies such as "Admin actualiza libros" before they can evaluate admin role.
-- Keep anon/public revoked, but let authenticated users execute the boolean
-- helper required by RLS.

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
