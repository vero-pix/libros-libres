import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/delete
 *
 * Cierra la cuenta del usuario autenticado. Nació el 30-08-2026: una vendedora
 * de Viña del Mar tuvo que pedirlo por WhatsApp porque el sitio no tenía dónde
 * hacerlo, y con 334 registrados ese camino no escala.
 *
 * Borra en el orden que exigen las FK (page_views y cart_items no tienen
 * cascade), igual que el cron de cleanup-bots.
 *
 * NO borra a quien tenga una venta o compra viva: primero hay que resolver esa
 * plata. Pero tampoco lo deja sin salida —esa es la regla de la casa—: devuelve
 * el detalle de qué lo bloquea y a quién escribirle.
 */

const SOPORTE = "vero@tuslibros.cl";

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
      { error: 'Para confirmar, escribe ELIMINAR en el campo.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── Ventas o compras sin cerrar ────────────────────────────────────────────
  // Una orden pagada que todavía no se entregó es plata de otra persona en
  // juego. No se borra la cuenta hasta resolverla.
  const VIVOS = ["pending", "paid", "shipped"];
  const [{ data: comoComprador }, { data: comoVendedor }] = await Promise.all([
    admin.from("orders").select("id, status").eq("buyer_id", user.id).in("status", VIVOS),
    admin.from("orders").select("id, status").eq("seller_id", user.id).in("status", VIVOS),
  ]);

  const pagadasVivas = [...(comoComprador ?? []), ...(comoVendedor ?? [])].filter(
    (o) => o.status === "paid" || o.status === "shipped"
  );

  if (pagadasVivas.length > 0) {
    return NextResponse.json(
      {
        error:
          `Tienes ${pagadasVivas.length} ${pagadasVivas.length === 1 ? "compra o venta pagada" : "compras o ventas pagadas"} sin cerrar. ` +
          `Para no dejar a nadie sin su libro ni sin su plata, primero hay que resolverlas. ` +
          `Escríbeme a ${SOPORTE} y lo vemos juntos el mismo día.`,
        soporte: SOPORTE,
      },
      { status: 409 }
    );
  }

  // ── Borrado ────────────────────────────────────────────────────────────────
  const { data: listings } = await admin
    .from("listings")
    .select("id")
    .eq("seller_id", user.id);
  const listingIds = (listings ?? []).map((l) => l.id);

  if (listingIds.length > 0) {
    // Carritos de OTRA gente que tenía sus libros guardados.
    await admin.from("cart_items").delete().in("listing_id", listingIds);
  }

  await admin.from("cart_items").delete().eq("user_id", user.id);
  await admin.from("page_views").delete().eq("user_id", user.id);
  await admin.from("listings").delete().eq("seller_id", user.id);
  await admin.from("book_requests").delete().eq("user_id", user.id);

  const { data: perfil } = await admin
    .from("users")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  const { error: userErr } = await admin.from("users").delete().eq("id", user.id);
  if (userErr) {
    console.error(`[account/delete] No se borró la fila de users ${user.id}:`, userErr.message);
    return NextResponse.json(
      { error: `No pudimos completar el cierre. Escríbeme a ${SOPORTE} y lo hago a mano.` },
      { status: 500 }
    );
  }

  if (perfil?.email) {
    await admin.from("newsletter_subscribers").delete().eq("email", perfil.email);
  }

  const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
  if (authErr) {
    // El perfil ya no existe, así que la cuenta quedó inutilizable igual. Se
    // registra para poder limpiar el resto a mano.
    console.error(`[account/delete] Quedó el usuario de auth ${user.id}:`, authErr.message);
  }

  await supabase.auth.signOut();

  return NextResponse.json({
    ok: true,
    listingsEliminados: listingIds.length,
  });
}
