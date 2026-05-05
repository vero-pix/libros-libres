-- ============================================================
-- Fix usuarios que no pueden actualizar su propio perfil
-- Fecha: 2026-05-05
-- ============================================================
--
-- PROBLEMA RAÍZ:
-- 20260429_security_hardening.sql revocó EXECUTE en is_admin()
-- de anon, authenticated y public. Cuando un usuario autenticado
-- hace UPDATE en la tabla users, Postgres evalúa TODAS las
-- policies de UPDATE (incluida "Admin actualiza usuarios"), lo
-- que llama a is_admin() y falla con "permission denied".
--
-- Además, no existía una policy explícita que permitiera a cada
-- usuario actualizar su propia fila — sólo la del admin.
--
-- SOLUCIÓN:
-- 1. Restaurar EXECUTE de is_admin() para authenticated
--    (ya intentado en 20260503_fix_is_admin_rls_execute.sql,
--     pero puede no haberse aplicado en producción)
-- 2. Agregar policy "Usuario actualiza su propio perfil"
-- ============================================================

-- 1. Asegurar permisos correctos en is_admin()
-- Revocar de anon/public (seguridad), restaurar para authenticated
-- (necesario para que las policies de RLS funcionen correctamente)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. Agregar policy de auto-actualización si no existe
-- Esto permite que cada usuario actualice SOLO su propia fila,
-- sin pasar por is_admin() y sin depender del admin.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename  = 'users'
          AND schemaname = 'public'
          AND policyname = 'Usuario actualiza su propio perfil'
    ) THEN
        -- Policy de UPDATE: el usuario sólo puede tocar su propia fila
        CREATE POLICY "Usuario actualiza su propio perfil"
            ON public.users
            FOR UPDATE
            USING     (id = auth.uid())
            WITH CHECK (id = auth.uid());
    END IF;
END $$;
