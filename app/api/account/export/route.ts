import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { paginar } from "@/lib/supabase/paginar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/account/export
 *
 * "Descargar mis datos" (Ley 21.719, art. 9, derecho de portabilidad; rige el
 * 01-12-2026). Devuelve en JSON todo lo que el sitio guarda de la persona
 * autenticada, como archivo `mis-datos-tuslibros.json`.
 *
 * Regla: nada de terceros. De la contraparte (comprador, vendedor, la otra
 * persona de una conversación) va SOLO su nombre de usuario. Por eso:
 *  - en los pedidos como VENDEDOR no va la dirección del comprador;
 *  - de las conversaciones van solo los mensajes que escribió esta persona;
 *  - de las reseñas recibidas, el puntaje y el comentario, firmado con el
 *    nombre de usuario de quien la escribió.
 * Tampoco van secretos: ni tokens de MercadoPago ni el valor de las llaves de API.
 *
 * Se lee con service role, siempre acotado a user.id: `users` tiene GRANT por
 * columna y con la sesión no se pueden leer el correo ni la dirección propios.
 */

const TROZO = 200;
function trozos<T>(arr: T[], n = TROZO): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

type Libro = { title: string | null; author: string | null; isbn: string | null } | null;
const libro = (b: unknown): Libro => {
  const x = (Array.isArray(b) ? b[0] : b) as Libro;
  return x ? { title: x.title, author: x.author, isbn: x.isbn } : null;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tienes que iniciar sesión." }, { status: 401 });
  }

  const admin = createServiceRoleClient();
  const uid = user.id;

  try {
    type Fila = Record<string, unknown>;
    const { data: perfilRaw } = await admin
      .from("users")
      .select(
        "id, email, full_name, username, avatar_url, phone, bio, public_email, instagram, city, " +
          "default_address, default_latitude, default_longitude, pickup_points, role, plan, " +
          "referral_code, on_vacation, vacation_message, acepta_transferencia, " +
          "mercadopago_connected_at, shipit_dispatch_mode, shipit_origin_commune, created_at, updated_at"
      )
      .eq("id", uid)
      .maybeSingle();
    // Los select armados con "+" no los entiende el tipado de supabase-js.
    const perfil = perfilRaw as unknown as Fila | null;

    const [
      publicaciones,
      comprasRaw,
      ventasRaw,
      mensajesRaw,
      ofertasRaw,
      reseñasEscritasRaw,
      reseñasRecibidasRaw,
      reseñasLibrosRaw,
      preguntasRaw,
      seBuscaRaw,
      carritoRaw,
      busquedas,
    ] = (await Promise.all([
      paginar((d, h) =>
        admin
          .from("listings")
          .select(
            "id, slug, status, modality, price, original_price, condition, notes, address, " +
              "cover_image_url, acepta_ofertas, created_at, updated_at, book:books(title, author, isbn)"
          )
          .eq("seller_id", uid)
          .order("created_at")
          .range(d, h)
      ),
      paginar((d, h) =>
        admin
          .from("orders")
          .select(
            "id, bundle_id, listing_id, seller_id, status, book_price, shipping_cost, service_fee, " +
              "discount_code, discount_amount, total, payment_method, shipping_speed, courier, tracking_code, " +
              "buyer_address, buyer_commune, created_at, updated_at, listing:listings(book:books(title, author, isbn))"
          )
          .eq("buyer_id", uid)
          .order("created_at")
          .range(d, h)
      ),
      paginar((d, h) =>
        admin
          .from("orders")
          .select(
            "id, bundle_id, listing_id, buyer_id, status, book_price, shipping_cost, service_fee, " +
              "total, payment_method, shipping_speed, courier, tracking_code, created_at, updated_at, " +
              "listing:listings(book:books(title, author, isbn))"
          )
          .eq("seller_id", uid)
          .order("created_at")
          .range(d, h)
      ),
      paginar((d, h) =>
        admin
          .from("messages")
          .select("id, conversation_id, body, created_at, offer_id")
          .eq("sender_id", uid)
          .order("created_at")
          .range(d, h)
      ),
      paginar((d, h) =>
        admin
          .from("offers")
          .select(
            "id, listing_id, buyer_id, seller_id, made_by, amount, listing_price, status, ronda, " +
              "created_at, responded_at, expires_at, listing:listings(book:books(title, author, isbn))"
          )
          .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
          .order("created_at")
          .range(d, h)
      ),
      paginar((d, h) =>
        admin
          .from("reviews")
          .select("id, listing_id, order_id, seller_id, rating, comment, created_at")
          .eq("reviewer_id", uid)
          .order("created_at")
          .range(d, h)
      ),
      paginar((d, h) =>
        admin
          .from("reviews")
          .select("id, listing_id, order_id, reviewer_id, rating, comment, created_at")
          .eq("seller_id", uid)
          .order("created_at")
          .range(d, h)
      ),
      paginar((d, h) =>
        admin
          .from("book_reviews")
          .select("id, rating, title, body, status, created_at, book:books(title, author, isbn)")
          .eq("reviewer_id", uid)
          .order("created_at")
          .range(d, h)
      ),
      paginar((d, h) =>
        admin
          .from("questions")
          .select("id, listing_id, question, answer, answered_at, created_at")
          .eq("asker_id", uid)
          .order("created_at")
          .range(d, h)
      ),
      paginar((d, h) =>
        admin
          .from("book_requests")
          .select(
            "id, title, author, isbn, notes, tema, requester_name, requester_email, requester_whatsapp, " +
              "requester_location, fulfilled, fulfilled_at, created_at"
          )
          .eq("requester_user_id", uid)
          .order("created_at")
          .range(d, h)
      ),
      paginar((d, h) =>
        admin
          .from("cart_items")
          .select("listing_id, added_at")
          .eq("user_id", uid)
          .order("added_at")
          .range(d, h)
      ),
      paginar((d, h) =>
        admin
          .from("search_queries")
          .select("query, created_at")
          .eq("user_id", uid)
          .order("created_at")
          .range(d, h)
      ),
    ])) as unknown as Fila[][];

    // Conversaciones de esta persona, para poner el usuario de la contraparte
    // al lado de cada mensaje.
    const convIds = Array.from(new Set((mensajesRaw as { conversation_id: string }[]).map((m) => m.conversation_id)));
    const otroDe = new Map<string, string>();
    const libroDe = new Map<string, string | null>();
    for (const t of trozos(convIds)) {
      const { data } = await admin
        .from("conversations")
        .select("id, participant_1, participant_2, listing_id")
        .in("id", t);
      for (const c of data ?? []) {
        otroDe.set(c.id, c.participant_1 === uid ? c.participant_2 : c.participant_1);
        libroDe.set(c.id, c.listing_id);
      }
    }

    // Nombres de usuario de las contrapartes: lo único de terceros que va.
    type ConId = Fila;
    const idsTerceros = new Set<string>();
    for (const o of ventasRaw as ConId[]) idsTerceros.add(o.buyer_id as string);
    for (const o of comprasRaw as ConId[]) idsTerceros.add(o.seller_id as string);
    for (const o of ofertasRaw as ConId[]) idsTerceros.add((o.buyer_id === uid ? o.seller_id : o.buyer_id) as string);
    for (const r of reseñasEscritasRaw as ConId[]) if (r.seller_id) idsTerceros.add(r.seller_id as string);
    for (const r of reseñasRecibidasRaw as ConId[]) idsTerceros.add(r.reviewer_id as string);
    otroDe.forEach((id) => idsTerceros.add(id));
    idsTerceros.delete(uid);

    const usuario = new Map<string, string | null>();
    for (const t of trozos(Array.from(idsTerceros))) {
      const { data } = await admin.from("users").select("id, username").in("id", t);
      for (const u of data ?? []) usuario.set(u.id, u.username ?? null);
    }
    const quien = (id: unknown) => (typeof id === "string" ? usuario.get(id) ?? null : null);

    const sinCampos = (obj: ConId, campos: string[]) => {
      const copia = { ...obj };
      for (const c of campos) delete copia[c];
      return copia;
    };

    const { data: cuentasVinculadas } = await admin.auth.admin.getUserById(uid);
    const auth = cuentasVinculadas?.user;

    let newsletter: { subscribed_at: string; unsubscribed_at: string | null } | null = null;
    const correo = (perfil?.email as string | null | undefined) ?? user.email;
    if (correo) {
      const { data } = await admin
        .from("newsletter_subscribers")
        .select("subscribed_at, unsubscribed_at")
        .eq("email", correo)
        .maybeSingle();
      newsletter = data ?? null;
    }

    const datos = {
      sitio: "tuslibros.cl",
      generado_el: new Date().toISOString(),
      nota:
        "Esta es una copia de los datos que guardo de ti en tuslibros.cl. De las otras personas " +
        "(compradores, vendedores, conversaciones) va solo su nombre de usuario. Si algo no cuadra " +
        "o quieres que lo corrija, escríbeme. — Vero",
      cuenta: {
        correo_de_acceso: auth?.email ?? user.email ?? null,
        creada_el: auth?.created_at ?? null,
        ultimo_ingreso: auth?.last_sign_in_at ?? null,
        formas_de_entrar: (auth?.identities ?? []).map((i) => i.provider),
      },
      perfil: perfil ?? null,
      direcciones_guardadas: perfil
        ? {
            direccion_por_defecto: (perfil as ConId).default_address ?? null,
            puntos_de_retiro: (perfil as ConId).pickup_points ?? [],
          }
        : null,
      publicaciones: (publicaciones as ConId[]).map((l) => ({ ...l, book: libro(l.book) })),
      compras: (comprasRaw as ConId[]).map((o) => ({
        ...sinCampos(o, ["seller_id", "listing"]),
        libro: libro((o.listing as ConId | null)?.book),
        vendedor: quien(o.seller_id),
      })),
      ventas: (ventasRaw as ConId[]).map((o) => ({
        ...sinCampos(o, ["buyer_id", "listing"]),
        libro: libro((o.listing as ConId | null)?.book),
        comprador: quien(o.buyer_id),
      })),
      mensajes_que_escribiste: (mensajesRaw as ConId[]).map((m) => ({
        id: m.id,
        conversacion: m.conversation_id,
        con: quien(otroDe.get(m.conversation_id as string)),
        publicacion: libroDe.get(m.conversation_id as string) ?? null,
        texto: m.body,
        enviado_el: m.created_at,
      })),
      ofertas: (ofertasRaw as ConId[]).map((o) => ({
        ...sinCampos(o, ["buyer_id", "seller_id", "listing"]),
        rol: o.buyer_id === uid ? "comprador" : "vendedor",
        con: quien(o.buyer_id === uid ? o.seller_id : o.buyer_id),
        libro: libro((o.listing as ConId | null)?.book),
      })),
      reseñas_que_escribiste: (reseñasEscritasRaw as ConId[]).map((r) => ({
        ...sinCampos(r, ["seller_id"]),
        vendedor: quien(r.seller_id),
      })),
      reseñas_de_libros_que_escribiste: (reseñasLibrosRaw as ConId[]).map((r) => ({ ...r, book: libro(r.book) })),
      reseñas_que_recibiste: (reseñasRecibidasRaw as ConId[]).map((r) => ({
        ...sinCampos(r, ["reviewer_id"]),
        de: quien(r.reviewer_id),
      })),
      preguntas_que_hiciste: preguntasRaw,
      se_busca: seBuscaRaw,
      carrito: carritoRaw,
      busquedas_con_sesion: busquedas,
      newsletter,
    };

    return new NextResponse(JSON.stringify(datos, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mis-datos-tuslibros.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error(`[account/export] ${uid}:`, e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "No pude armar el archivo. Prueba de nuevo en un rato; si sigue fallando, escríbeme." },
      { status: 500 }
    );
  }
}
