-- Agregar campo role a users (default 'user', admin = 'admin')
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Función helper para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Admins pueden ver todos los pedidos
CREATE POLICY "Admin ve todos los pedidos"
  ON public.orders FOR SELECT
  USING (public.is_admin());

-- Admins pueden actualizar cualquier pedido
CREATE POLICY "Admin actualiza pedidos"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- Admins pueden actualizar cualquier publicación
CREATE POLICY "Admin actualiza publicaciones"
  ON public.listings FOR UPDATE
  USING (public.is_admin());

-- Admins pueden eliminar cualquier publicación
CREATE POLICY "Admin elimina publicaciones"
  ON public.listings FOR DELETE
  USING (public.is_admin());

-- Admins pueden actualizar cualquier libro
CREATE POLICY "Admin actualiza libros"
  ON public.books FOR UPDATE
  USING (public.is_admin());

-- Admins pueden actualizar usuarios
CREATE POLICY "Admin actualiza usuarios"
  ON public.users FOR UPDATE
  USING (public.is_admin());

-- IMPORTANTE: Marca tu usuario como admin manualmente:
-- UPDATE public.users SET role = 'admin' WHERE email = 'tu@email.com';
