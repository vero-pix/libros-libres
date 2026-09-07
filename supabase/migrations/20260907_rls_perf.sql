-- RLS: policies más baratas (Supabase Advisor, 07-09-2026).
--
-- Dos problemas que el advisor marcaba en 46 y 60 policies:
--
-- 1. `auth.uid()` / `is_admin()` a secas se evalúa POR FILA. Envuelto en
--    `(select ...)` Postgres lo evalúa una vez por consulta (initplan).
-- 2. Varias policies PERMISSIVE para la misma tabla y comando se evalúan
--    todas en cada fila. Acá se fusionan en una sola con OR. Además había
--    dos duplicadas en listings (DELETE repetido y un SELECT subsumido).
--
-- Los EXISTS(select 1 from users where role='admin') a mano se reemplazan por
-- is_admin(), que ya es SECURITY DEFINER + STABLE y hace exactamente eso.
--
-- Permisos resultantes = los mismos de antes. No se abre ni cierra nada.
--
-- Verificado en seco el 07-09-2026 (transacción con rollback, conteos como
-- anon, como vero y como un uid que no existe en users): idénticos antes y
-- después. Dos diferencias, las dos de "error" a "0 filas":
--   · anon sobre orders/commissions daba "permission denied for function
--     is_admin" (anon no tenía EXECUTE sobre is_admin; hoy se le da).
--   · anon sobre page_views daba "permission denied for table users": el
--     EXISTS a mano leía users.role, columna que anon no puede ver desde el
--     cierre de PII del 25-08. is_admin() es SECURITY DEFINER y no choca.

begin;

-- is_admin() solo tenía EXECUTE para postgres, service_role y authenticated.
-- Como ahora la usan policies que también evalúa anon, hay que dárselo.
grant execute on function public.is_admin() to anon, authenticated;

-- api_keys ------------------------------------------------------------------
drop policy if exists sellers_delete_own_keys on public.api_keys;
drop policy if exists sellers_select_own_keys on public.api_keys;
create policy sellers_select_own_keys on public.api_keys for select
  using ((select auth.uid()) = seller_id);
create policy sellers_delete_own_keys on public.api_keys for delete
  using ((select auth.uid()) = seller_id);

-- book_requests -------------------------------------------------------------
drop policy if exists book_requests_admin_update on public.book_requests;
create policy book_requests_admin_update on public.book_requests for update
  using ((select public.is_admin()));

-- book_reviews --------------------------------------------------------------
drop policy if exists "Usuario crea su reseña" on public.book_reviews;
drop policy if exists "Usuario edita su reseña" on public.book_reviews;
create policy "Usuario crea su reseña" on public.book_reviews for insert
  with check ((select auth.uid()) = reviewer_id);
create policy "Usuario edita su reseña" on public.book_reviews for update
  using ((select auth.uid()) = reviewer_id);

-- books ---------------------------------------------------------------------
drop policy if exists "Autenticados pueden insertar libros" on public.books;
drop policy if exists "Admin actualiza libros" on public.books;
drop policy if exists "Creador puede actualizar libro" on public.books;
create policy "Autenticados pueden insertar libros" on public.books for insert
  with check ((select auth.uid()) is not null);
create policy "Admin o creador actualiza libro" on public.books for update
  using ((select public.is_admin()) or (select auth.uid()) = created_by);

-- cart_items ----------------------------------------------------------------
drop policy if exists "Usuario ve su carrito" on public.cart_items;
drop policy if exists "Usuario agrega al carrito" on public.cart_items;
drop policy if exists "Usuario elimina de su carrito" on public.cart_items;
create policy "Usuario ve su carrito" on public.cart_items for select
  using ((select auth.uid()) = user_id);
create policy "Usuario agrega al carrito" on public.cart_items for insert
  with check ((select auth.uid()) = user_id);
create policy "Usuario elimina de su carrito" on public.cart_items for delete
  using ((select auth.uid()) = user_id);

-- categories ----------------------------------------------------------------
-- "Admin writes categories" era FOR ALL y se sumaba a la de lectura pública.
drop policy if exists "Admin writes categories" on public.categories;
create policy "Admin inserts categories" on public.categories for insert
  with check ((select public.is_admin()));
create policy "Admin updates categories" on public.categories for update
  using ((select public.is_admin()));
create policy "Admin deletes categories" on public.categories for delete
  using ((select public.is_admin()));

-- cities --------------------------------------------------------------------
drop policy if exists "Admin can write cities" on public.cities;
drop policy if exists "Admin can update cities" on public.cities;
drop policy if exists "Admin can delete cities" on public.cities;
create policy "Admin can write cities" on public.cities for insert
  with check ((select public.is_admin()));
create policy "Admin can update cities" on public.cities for update
  using ((select public.is_admin()));
create policy "Admin can delete cities" on public.cities for delete
  using ((select public.is_admin()));

-- commissions ---------------------------------------------------------------
drop policy if exists "Admin ve comisiones" on public.commissions;
drop policy if exists "Vendedor ve sus comisiones" on public.commissions;
create policy "Admin o vendedor ve comisiones" on public.commissions for select
  using ((select public.is_admin()) or (select auth.uid()) = seller_id);

-- contact_messages ----------------------------------------------------------
drop policy if exists "Admin reads contact messages" on public.contact_messages;
drop policy if exists "Admin updates contact messages" on public.contact_messages;
create policy "Admin reads contact messages" on public.contact_messages for select
  using ((select public.is_admin()));
create policy "Admin updates contact messages" on public.contact_messages for update
  using ((select public.is_admin()));

-- conversations -------------------------------------------------------------
drop policy if exists "User creates conversation" on public.conversations;
drop policy if exists "Participant sees conversation" on public.conversations;
drop policy if exists "Participant updates conversation" on public.conversations;
create policy "User creates conversation" on public.conversations for insert
  with check ((select auth.uid()) in (participant_1, participant_2));
create policy "Participant sees conversation" on public.conversations for select
  using ((select auth.uid()) in (participant_1, participant_2));
create policy "Participant updates conversation" on public.conversations for update
  using ((select auth.uid()) in (participant_1, participant_2));

-- listing_images ------------------------------------------------------------
drop policy if exists "Vendedor agrega imágenes" on public.listing_images;
drop policy if exists "Vendedor elimina imágenes" on public.listing_images;
create policy "Vendedor agrega imágenes" on public.listing_images for insert
  with check ((select auth.uid()) = (select seller_id from public.listings where id = listing_images.listing_id));
create policy "Vendedor elimina imágenes" on public.listing_images for delete
  using ((select auth.uid()) = (select seller_id from public.listings where id = listing_images.listing_id));

-- listings ------------------------------------------------------------------
-- Había 3 DELETE (dos idénticas), 2 SELECT (una subsumida) y 2 UPDATE.
drop policy if exists "Admin elimina publicaciones" on public.listings;
drop policy if exists "Vendedor elimina su publicación" on public.listings;
drop policy if exists "Vendedor puede eliminar su publicación" on public.listings;
drop policy if exists "Autenticados pueden crear publicaciones" on public.listings;
drop policy if exists "Public can view listings" on public.listings;
drop policy if exists "Publicaciones activas y vendidas visibles para todos" on public.listings;
drop policy if exists "Admin actualiza publicaciones" on public.listings;
drop policy if exists "Vendedor puede actualizar su publicación" on public.listings;
create policy "Publicaciones activas y vendidas visibles para todos" on public.listings for select
  using (status in ('active', 'completed') or (select auth.uid()) = seller_id);
create policy "Autenticados pueden crear publicaciones" on public.listings for insert
  with check ((select auth.uid()) = seller_id);
create policy "Admin o vendedor actualiza publicación" on public.listings for update
  using ((select public.is_admin()) or (select auth.uid()) = seller_id);
create policy "Admin o vendedor elimina publicación" on public.listings for delete
  using ((select public.is_admin()) or (select auth.uid()) = seller_id);

-- messages ------------------------------------------------------------------
drop policy if exists "Participant sees messages" on public.messages;
drop policy if exists "Participant sends message" on public.messages;
drop policy if exists "Recipient marks read" on public.messages;
create policy "Participant sees messages" on public.messages for select
  using (exists (select 1 from public.conversations c
                 where c.id = messages.conversation_id
                   and (select auth.uid()) in (c.participant_1, c.participant_2)));
create policy "Participant sends message" on public.messages for insert
  with check ((select auth.uid()) = sender_id
              and exists (select 1 from public.conversations c
                          where c.id = messages.conversation_id
                            and (select auth.uid()) in (c.participant_1, c.participant_2)));
create policy "Recipient marks read" on public.messages for update
  using (sender_id <> (select auth.uid())
         and exists (select 1 from public.conversations c
                     where c.id = messages.conversation_id
                       and (select auth.uid()) in (c.participant_1, c.participant_2)));

-- newsletter_subscribers ----------------------------------------------------
drop policy if exists "Admin reads subscribers" on public.newsletter_subscribers;
create policy "Admin reads subscribers" on public.newsletter_subscribers for select
  using ((select public.is_admin()));

-- orders --------------------------------------------------------------------
drop policy if exists "Buyers create orders" on public.orders;
drop policy if exists "Admin ve todos los pedidos" on public.orders;
drop policy if exists "Buyers see own orders" on public.orders;
drop policy if exists "Sellers see their orders" on public.orders;
drop policy if exists "Admin actualiza pedidos" on public.orders;
create policy "Buyers create orders" on public.orders for insert
  with check ((select auth.uid()) = buyer_id);
create policy "Admin, comprador o vendedor ve el pedido" on public.orders for select
  using ((select public.is_admin()) or (select auth.uid()) in (buyer_id, seller_id));
create policy "Admin actualiza pedidos" on public.orders for update
  using ((select public.is_admin()));

-- page_views ----------------------------------------------------------------
drop policy if exists "Admin reads views" on public.page_views;
create policy "Admin reads views" on public.page_views for select
  using ((select public.is_admin()));

-- questions -----------------------------------------------------------------
drop policy if exists "Usuario crea pregunta" on public.questions;
drop policy if exists "Vendedor responde pregunta" on public.questions;
create policy "Usuario crea pregunta" on public.questions for insert
  with check ((select auth.uid()) = asker_id);
create policy "Vendedor responde pregunta" on public.questions for update
  using (exists (select 1 from public.listings l
                 where l.id = questions.listing_id and l.seller_id = (select auth.uid())));

-- referrals -----------------------------------------------------------------
drop policy if exists "User creates referral" on public.referrals;
drop policy if exists "User sees own referrals" on public.referrals;
drop policy if exists "User updates own referral" on public.referrals;
create policy "User creates referral" on public.referrals for insert
  with check ((select auth.uid()) = referrer_id);
create policy "User sees own referrals" on public.referrals for select
  using ((select auth.uid()) in (referrer_id, referred_id));
create policy "User updates own referral" on public.referrals for update
  using ((select auth.uid()) in (referrer_id, referred_id));

-- rentals (descontinuado, pero la tabla sigue con RLS) ----------------------
drop policy if exists "Autenticados pueden crear arriendos" on public.rentals;
drop policy if exists "Admin ve todos los arriendos" on public.rentals;
drop policy if exists "Arrendatario ve sus arriendos" on public.rentals;
drop policy if exists "Admin actualiza arriendos" on public.rentals;
drop policy if exists "Participantes pueden actualizar arriendo" on public.rentals;
create policy "Autenticados pueden crear arriendos" on public.rentals for insert
  with check ((select auth.uid()) = renter_id);
create policy "Admin o participante ve arriendo" on public.rentals for select
  using ((select public.is_admin()) or (select auth.uid()) in (renter_id, owner_id));
create policy "Admin o participante actualiza arriendo" on public.rentals for update
  using ((select public.is_admin()) or (select auth.uid()) in (renter_id, owner_id));

-- reviews -------------------------------------------------------------------
drop policy if exists "Usuario crea review" on public.reviews;
create policy "Usuario crea review" on public.reviews for insert
  with check ((select auth.uid()) = reviewer_id);

-- search_queries ------------------------------------------------------------
drop policy if exists "Admin reads searches" on public.search_queries;
create policy "Admin reads searches" on public.search_queries for select
  using ((select public.is_admin()));

-- survey_responses ----------------------------------------------------------
drop policy if exists survey_admin_read on public.survey_responses;
create policy survey_admin_read on public.survey_responses for select
  using ((select public.is_admin()));

-- users ---------------------------------------------------------------------
drop policy if exists "Admin actualiza usuarios" on public.users;
drop policy if exists "Usuario edita su propio perfil" on public.users;
create policy "Admin o el propio usuario edita el perfil" on public.users for update
  using ((select public.is_admin()) or (select auth.uid()) = id);

commit;
