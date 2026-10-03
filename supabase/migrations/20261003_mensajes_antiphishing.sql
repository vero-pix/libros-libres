-- Phishing del 03-10-2026: dos cuentas nuevas ("Tuslibros" y "Tuslibros Admin")
-- mandaron mensajes de "tu cuenta fue suspendida, verifica aquí". El filtro de
-- /api/messages no basta: la RLS deja insertar en `messages` directo con la API
-- de Supabase. Estas reglas viven en la base para que no haya cómo saltárselas.
-- Las inserciones del servidor (service_role, auth.uid() nulo) y de admins pasan.

-- 1. Mensajes: sin links externos y tope para cuentas nuevas.
create or replace function public.mensajes_guardia()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  creada timestamptz;
  recientes int;
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if regexp_replace(new.body, '(https?://)?(www\.)?tuslibros\.cl\S*', '', 'gi')
     ~* '(https?://|www\.|[[:alnum:]-]+\.[[:alpha:]]{2,}\s*/|[[:alnum:]-]+\.(com|net|org|info|ink|io|co|us|ly|me|xyz|top|site|online|app|link|click|cc|tk|ru|cn|su|ws|to|gl|gd|sh)([^[:alnum:]]|$)|[[:alnum:]-]+\.[^\x01-\x7F[:space:].,;:!?)]{2,})'
  then
    raise exception 'Por seguridad no se pueden enviar links en los mensajes.'
      using errcode = 'check_violation';
  end if;

  select created_at into creada from auth.users where id = auth.uid();
  if creada > now() - interval '7 days' then
    select count(*) into recientes
      from public.messages
     where sender_id = auth.uid()
       and created_at > now() - interval '1 hour';
    if recientes >= 10 then
      raise exception 'Escribiste muchos mensajes seguidos. Espera un rato y sigue.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists mensajes_guardia on public.messages;
create trigger mensajes_guardia
  before insert on public.messages
  for each row execute function public.mensajes_guardia();

-- 2. Quien recibe un mensaje solo puede marcarlo leído, no reescribirlo.
--    La política "Recipient marks read" no limitaba las columnas.
create or replace function public.mensajes_solo_leido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin()
     and (new.body is distinct from old.body
          or new.sender_id is distinct from old.sender_id
          or new.conversation_id is distinct from old.conversation_id) then
    raise exception 'Solo se puede marcar el mensaje como leído.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists mensajes_solo_leido on public.messages;
create trigger mensajes_solo_leido
  before update on public.messages
  for each row execute function public.mensajes_solo_leido();

-- 3. Nadie que no sea admin aparece como la marca. Al registrarse no hay
--    sesión todavía (auth.uid() nulo): ahí el nombre se reemplaza en vez de
--    rechazarlo, para no romper el registro. Después, cambiarlo se rechaza.
create or replace function public.usuarios_sin_nombre_de_marca()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  patron constant text := '(tus[[:space:]._-]*libros|soporte|support|admin|verificaci)';
begin
  if new.role = 'admin' then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and new.full_name is not distinct from old.full_name
     and new.username is not distinct from old.username then
    return new;
  end if;
  if coalesce(new.full_name, '') !~* patron and coalesce(new.username, '') !~* patron then
    return new;
  end if;

  if auth.uid() is null then
    if coalesce(new.full_name, '') ~* patron then
      new.full_name := 'Usuario nuevo';
    end if;
    if coalesce(new.username, '') ~* patron then
      new.username := 'usuario.' || left(replace(new.id::text, '-', ''), 8);
    end if;
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  raise exception 'Ese nombre no está disponible.'
    using errcode = 'check_violation';
end;
$$;

drop trigger if exists usuarios_sin_nombre_de_marca on public.users;
create trigger usuarios_sin_nombre_de_marca
  before insert or update on public.users
  for each row execute function public.usuarios_sin_nombre_de_marca();
