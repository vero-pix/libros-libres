import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { paginar } from "@/lib/supabase/paginar";
import { VERO_INBOX } from "@/lib/veroInbox";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/account/delete
 *
 * Cierra la cuenta del usuario autenticado. Nació el 30-08-2026: una vendedora
 * de Viña del Mar tuvo que pedirlo por WhatsApp porque el sitio no tenía dónde
 * hacerlo.
 *
 * REESCRITO EL 04-10-2026 (Ley 21.719, derecho de supresión, rige 01-12-2026).
 * La versión anterior hacía `users.delete()` y fallaba para cualquiera con
 * historial: `orders`, `messages`, `conversations`, `questions`, `reviews`,
 * `referrals`, `rentals` y `commissions` apuntan a `users` con NO ACTION, y
 * `shipments` con RESTRICT. Además `public.users.id` referencia a `auth.users`
 * con ON DELETE CASCADE, así que `auth.admin.deleteUser` choca con las mismas FK.
 *
 * Ahora la regla es: SE BORRA lo que no hace falta y SE ANONIMIZA lo que hay que
 * conservar.
 *
 *  - Se borra: publicaciones que nunca se vendieron (activas o pausadas), sus
 *    fotos, los "Se busca", el carrito, reservas, llaves de API, credenciales de
 *    MercadoPago, la suscripción al newsletter y la foto de perfil.
 *  - Se anonimiza: la fila de `users` (nombre → "Usuario eliminado", sin
 *    teléfono, dirección, bio, redes, correo ni puntos de retiro), la dirección
 *    de los pedidos que hizo como comprador y la ubicación de sus publicaciones.
 *  - Se conserva: pedidos, envíos y comisiones (respaldo tributario y de la ley
 *    del consumidor), los libros ya vendidos (los pedidos los referencian con
 *    `listing_id NOT NULL`) y los mensajes, para que la otra persona no pierda
 *    la conversación: el remitente aparece como "Usuario eliminado".
 *
 * Auth: primero se intenta `deleteUser`. Si la persona no tiene historial, la
 * cascada borra limpio la fila de `users`. Si tiene historial, Postgres rechaza
 * el borrado entero (es una sola transacción, no deja nada a medias) y entonces
 * se BANEA la cuenta por 100 años y se le cambia el correo a uno inexistente,
 * para que no pueda entrar ni quede su correo real en Auth. Así ninguna fila
 * queda huérfana.
 *
 * Sigue bloqueando a quien tenga una venta o compra pagada y viva, pero con
 * salida: le dice a quién escribirle.
 */

const SOPORTE = VERO_INBOX;
const NOMBRE_ANONIMO = "Usuario eliminado";
const TROZO = 200; // ids por `.in()`, para no armar URLs gigantes

function trozos<T>(arr: T[], n = TROZO): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

type Admin = ReturnType<typeof createServiceRoleClient>;

/** Lista recursiva de archivos bajo un prefijo del bucket `covers`. */
async function listarArchivos(admin: Admin, prefijo: string): Promise<string[]> {
  const rutas: string[] = [];
  const pendientes = [prefijo];
  while (pendientes.length > 0 && rutas.length < 20_000) {
    const carpeta = pendientes.shift()!;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await admin.storage
        .from("covers")
        .list(carpeta, { limit: 1000, offset });
      if (error || !data || data.length === 0) break;
      for (const item of data) {
        const ruta = `${carpeta}/${item.name}`;
        // En Storage las "carpetas" vienen sin id.
        if (item.id == null) pendientes.push(ruta);
        else rutas.push(ruta);
      }
      if (data.length < 1000) break;
    }
  }
  return rutas;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tienes que iniciar sesión." }, { status: 401 });
  }

  // Confirmación escrita: el cliente manda la palabra exacta que se le pidió.
  let confirmacion = "";
  try {
    const body = await request.json();
    confirmacion = String(body?.confirmacion ?? "").trim().toUpperCase();
  } catch {
    // cuerpo inválido: cae en la validación de abajo
  }
  if (confirmacion !== "ELIMINAR") {
    return NextResponse.json(
      { error: "Para confirmar, escribe ELIMINAR en el campo." },
      { status: 400 }
    );
  }

  const admin = createServiceRoleClient();
  const uid = user.id;

  const { data: perfil } = await admin
    .from("users")
    .select("email, role")
    .eq("id", uid)
    .maybeSingle();

  if (perfil?.role === "admin") {
    return NextResponse.json(
      { error: "Una cuenta de administración no se cierra desde aquí." },
      { status: 403 }
    );
  }

  // ── Ventas, compras o arriendos sin cerrar ────────────────────────────────
  // Una orden pagada que todavía no se entregó es plata de otra persona en
  // juego. No se cierra la cuenta hasta resolverla.
  const PAGADAS_VIVAS = ["paid", "shipped"];
  const ARRIENDOS_VIVOS = ["paid", "active", "returning", "overdue"];
  const [{ data: c1 }, { data: c2 }, { data: r1 }, { data: r2 }] = await Promise.all([
    admin.from("orders").select("id").eq("buyer_id", uid).in("status", PAGADAS_VIVAS),
    admin.from("orders").select("id").eq("seller_id", uid).in("status", PAGADAS_VIVAS),
    admin.from("rentals").select("id").eq("renter_id", uid).in("status", ARRIENDOS_VIVOS),
    admin.from("rentals").select("id").eq("owner_id", uid).in("status", ARRIENDOS_VIVOS),
  ]);
  const vivas = (c1?.length ?? 0) + (c2?.length ?? 0) + (r1?.length ?? 0) + (r2?.length ?? 0);

  if (vivas > 0) {
    return NextResponse.json(
      {
        error:
          `Tienes ${vivas} ${vivas === 1 ? "compra o venta pagada" : "compras o ventas pagadas"} sin cerrar. ` +
          `Para que nadie se quede sin su libro ni sin su plata, primero hay que terminarlas. ` +
          `Escríbeme a ${SOPORTE} y lo vemos juntos el mismo día.`,
        soporte: SOPORTE,
      },
      { status: 409 }
    );
  }

  const pasos: string[] = [];
  const fallo = (paso: string, msg: string) => {
    pasos.push(paso);
    console.error(`[account/delete] ${uid} · ${paso}: ${msg}`);
  };

  try {
    // ── 1. Publicaciones ────────────────────────────────────────────────────
    const publicaciones = await paginar<{ id: string; status: string }>((d, h) =>
      admin.from("listings").select("id, status").eq("seller_id", uid).order("id").range(d, h)
    );
    const ids = publicaciones.map((l) => l.id);

    // Las que tienen pedidos o arriendos se quedan (FK NOT NULL desde orders y
    // rentals); el resto se borra.
    const conHistorial = new Set<string>();
    for (const t of trozos(ids)) {
      const [{ data: o }, { data: r }] = await Promise.all([
        admin.from("orders").select("listing_id").in("listing_id", t),
        admin.from("rentals").select("listing_id").in("listing_id", t),
      ]);
      for (const x of [...(o ?? []), ...(r ?? [])]) conHistorial.add(x.listing_id);
    }
    const aBorrar = ids.filter((id) => !conHistorial.has(id));
    const aConservar = ids.filter((id) => conHistorial.has(id));

    // Fotos que siguen en uso por un libro ya vendido no se tocan.
    const urlsEnUso = new Set<string>();
    for (const t of trozos(aConservar)) {
      const [{ data: l }, { data: im }] = await Promise.all([
        admin.from("listings").select("cover_image_url").in("id", t),
        admin.from("listing_images").select("image_url").in("listing_id", t),
      ]);
      for (const x of l ?? []) if (x.cover_image_url) urlsEnUso.add(x.cover_image_url);
      for (const x of im ?? []) if (x.image_url) urlsEnUso.add(x.image_url);
    }

    // Borrar: cascada a fotos, preguntas, ofertas, reservas, carritos ajenos,
    // ubicación e historial de slugs. conversations/page_views/book_requests
    // quedan con listing_id en null (SET NULL).
    for (const t of trozos(aBorrar)) {
      const { error } = await admin.from("listings").delete().in("id", t);
      if (error) fallo("borrar publicaciones", error.message);
    }

    // Conservar sin que se vean: las vivas pasan a "completed" y pierden la
    // ubicación (el trigger listings_separar_ubicacion lleva los null a
    // listing_locations).
    for (const t of trozos(aConservar)) {
      const { error: e1 } = await admin
        .from("listings")
        .update({ status: "completed" })
        .in("id", t)
        .in("status", ["active", "paused"]);
      if (e1) fallo("pausar publicaciones vendidas", e1.message);

      const cambios = { address: null, latitude: null, longitude: null, featured: false, featured_rank: null };
      const { error: e2 } = await admin.from("listings").update(cambios).in("id", t);
      if (e2) {
        // listings_price_minimo es NOT VALID: una fila vieja con precio < 1000
        // hace fallar el UPDATE del lote entero. Fila por fila, y a la que
        // choque se le quita el precio (el pedido guarda el suyo en book_price).
        for (const id of t) {
          const { error } = await admin.from("listings").update(cambios).eq("id", id);
          if (error) {
            const { error: e3 } = await admin
              .from("listings")
              .update({ ...cambios, status: "completed", price: null })
              .eq("id", id);
            if (e3) fallo(`anonimizar publicación ${id}`, e3.message);
          }
        }
      }
    }
    // Por si alguna quedó con la dirección exacta guardada aparte.
    const { error: eLoc } = await admin
      .from("listing_locations")
      .update({ address: null, latitude: null, longitude: null })
      .eq("seller_id", uid);
    if (eLoc) fallo("listing_locations", eLoc.message);

    // ── 2. Pedidos y ofertas ────────────────────────────────────────────────
    // Los pedidos sin pagar se cancelan; los cerrados se conservan, pero sin la
    // dirección de despacho de esta persona (queda la comuna).
    const [{ error: eo1 }, { error: eo2 }] = await Promise.all([
      admin.from("orders").update({ status: "cancelled" }).eq("buyer_id", uid).eq("status", "pending"),
      admin.from("orders").update({ status: "cancelled" }).eq("seller_id", uid).eq("status", "pending"),
    ]);
    if (eo1 || eo2) fallo("cancelar pedidos pendientes", (eo1 ?? eo2)!.message);

    const { error: eDir } = await admin
      .from("orders")
      .update({ buyer_address: null, buyer_latitude: null, buyer_longitude: null })
      .eq("buyer_id", uid);
    if (eDir) fallo("dirección de pedidos", eDir.message);

    const [{ error: ef1 }, { error: ef2 }] = await Promise.all([
      admin.from("offers").update({ status: "expired" }).eq("buyer_id", uid).eq("status", "pending"),
      admin.from("offers").update({ status: "expired" }).eq("seller_id", uid).eq("status", "pending"),
    ]);
    if (ef1 || ef2) fallo("ofertas pendientes", (ef1 ?? ef2)!.message);

    // ── 3. Lo que no hace falta guardar ────────────────────────────────────
    const borrados = await Promise.all([
      admin.from("cart_items").delete().eq("user_id", uid),
      admin.from("listing_reservations").delete().eq("buyer_id", uid),
      admin.from("book_requests").delete().eq("requester_user_id", uid),
      admin.from("api_keys").delete().eq("seller_id", uid),
      admin.from("mp_credentials").delete().eq("user_id", uid),
      admin.from("outreach_log").delete().eq("user_id", uid),
      admin.from("page_views").update({ user_id: null }).eq("user_id", uid),
      admin.from("search_queries").update({ user_id: null }).eq("user_id", uid),
      admin.from("survey_responses").update({ user_id: null, email: null }).eq("user_id", uid),
      // Las reseñas de libros se quedan (son de la comunidad), sin firma.
      admin.from("book_reviews").update({ reviewer_id: null, author_label: NOMBRE_ANONIMO }).eq("reviewer_id", uid),
    ]);
    borrados.forEach((r, i) => r.error && fallo(`limpieza #${i}`, r.error.message));

    const correo: string = String(perfil?.email ?? user.email ?? "").trim().toLowerCase();
    if (correo) {
      // ilike para no depender de mayúsculas, con % y _ escapados: un "_" en el
      // correo calzaría con cualquier letra y borraría a otra persona.
      const patron = correo.replace(/[\\%_]/g, (c: string) => `\\${c}`);
      await Promise.all([
        admin.from("newsletter_subscribers").delete().ilike("email", patron),
        // "Se busca" hechos sin sesión con el mismo correo.
        admin.from("book_requests").delete().ilike("requester_email", patron),
      ]);
    }

    // ── 4. Fotos del bucket ────────────────────────────────────────────────
    const archivos = [...(await listarArchivos(admin, uid)), `avatars/${uid}.jpg`];
    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/`;
    // Una portada subida por esta persona pudo quedar como portada del libro
    // (books.cover_url), que es compartido con otros vendedores: esa no se borra.
    const { data: portadasCompartidas } = await admin
      .from("books")
      .select("cover_url")
      .like("cover_url", `%/covers/${uid}/%`)
      .limit(1000);
    for (const b of portadasCompartidas ?? []) if (b.cover_url) urlsEnUso.add(b.cover_url);

    const sobrantes = archivos.filter((ruta) => !urlsEnUso.has(base + ruta));
    for (const t of trozos(sobrantes, 100)) {
      const { error } = await admin.storage.from("covers").remove(t);
      if (error) fallo("fotos", error.message);
    }

    // ── 5. Perfil anónimo ──────────────────────────────────────────────────
    const { error: eUser } = await admin
      .from("users")
      .update({
        full_name: NOMBRE_ANONIMO,
        username: `eliminado-${uid.replace(/-/g, "").slice(0, 12)}`,
        email: null,
        phone: null,
        bio: null,
        instagram: null,
        public_email: null,
        avatar_url: null,
        city: null,
        default_address: null,
        default_latitude: null,
        default_longitude: null,
        pickup_points: [],
        referral_code: null,
        mercadopago_user_id: null,
        mercadopago_connected_at: null,
        acepta_transferencia: false,
        datos_transferencia: null,
        on_vacation: false,
        vacation_message: null,
        featured: false,
        featured_seller_blocked: true,
        shipit_origin_id: null,
        shipit_origin_commune: null,
        shipit_auto_enabled: false,
      })
      .eq("id", uid);
    if (eUser) {
      fallo("perfil", eUser.message);
      return NextResponse.json(
        { error: `No pude terminar el cierre. Escríbeme a ${SOPORTE} y lo termino yo.`, soporte: SOPORTE },
        { status: 500 }
      );
    }

    // ── 6. Cuenta de Auth ──────────────────────────────────────────────────
    // Sin historial, deleteUser borra todo limpio (cascada a public.users). Con
    // historial, Postgres lo rechaza entero y se banea.
    const { error: eDel } = await admin.auth.admin.deleteUser(uid);
    if (eDel) {
      const { error: eBan } = await admin.auth.admin.updateUserById(uid, {
        email: `eliminado-${uid}@cuentas-eliminadas.invalid`,
        email_confirm: true,
        ban_duration: "876000h",
        user_metadata: { full_name: null, name: null, avatar_url: null, picture: null, phone: null },
        app_metadata: { cuenta_eliminada: new Date().toISOString() },
      });
      if (eBan) {
        // Al menos que no pueda volver a entrar.
        const { error: eBan2 } = await admin.auth.admin.updateUserById(uid, { ban_duration: "876000h" });
        fallo("auth", `${eBan.message}${eBan2 ? ` / ${eBan2.message}` : ""}`);
      }
    }
  } catch (e) {
    fallo("inesperado", e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { error: `No pude terminar el cierre. Escríbeme a ${SOPORTE} y lo termino yo.`, soporte: SOPORTE },
      { status: 500 }
    );
  }

  await supabase.auth.signOut();

  if (pasos.length > 0) {
    console.error(`[account/delete] ${uid} cerrada con pasos pendientes: ${pasos.join(", ")}`);
  }

  return NextResponse.json({ ok: true });
}
