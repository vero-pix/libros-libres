-- 04-10-2026 — El correo y el WhatsApp de quien deja un "Se busca" se podían
-- leer con la clave pública.
--
-- `anon` y `authenticated` tenían todos los privilegios de TABLA sobre
-- `book_requests` y la policy de SELECT es `true`: cualquiera podía pedir
-- requester_email y requester_whatsapp por la API (155 personas al 04-10).
--
-- Revisado contra el código:
--   - Las páginas públicas (/solicitudes, home, ficha, /novedades, registro)
--     piden solo título, autor, tema, notas, comuna y estado.
--   - Crear un pedido pasa por /api/requests con service role.
--   - El panel de admin lee la lista con service role desde este mismo cambio.
--   - ListingsTab (admin, navegador) desmarca `fulfilled` al borrar
--     publicaciones: necesita UPDATE en esas dos columnas; la policy de UPDATE
--     ya exige is_admin().

revoke all on public.book_requests from anon, authenticated;

grant select (
  id, title, author, isbn, notes, tema, requester_location,
  fulfilled, fulfilled_at, fulfilled_listing_id, created_at
) on public.book_requests to anon, authenticated;

grant update (fulfilled, fulfilled_listing_id) on public.book_requests to authenticated;

-- Quedan solo para service role: requester_email, requester_whatsapp,
-- requester_name, requester_user_id, last_notified_at, updated_at.
