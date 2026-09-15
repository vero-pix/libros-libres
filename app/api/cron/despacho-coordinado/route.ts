import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendEmail } from "@/lib/email";
import { sendGong, escapeHtml } from "@/lib/notifications";
import { VERO_INBOX } from "@/lib/veroInbox";
import { COURIER_COORDINADO, ESTADO_COORDINADO_PENDIENTE } from "@/lib/shipping/coordinado";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/despacho-coordinado — una vez al día (vercel.json).
 *
 * Despacho coordinado que el vendedor todavía no registra (ver
 * lib/shipping/coordinado.ts). Dos avisos, sin tabla de estado: cada venta
 * pagada cae UNA sola vez en cada ventana de 24 h, porque el cron corre una vez
 * al día.
 *
 *   · 48–72 h desde la compra  → correo al vendedor: "¿ya lo despachaste?"
 *   · 120–144 h desde la compra → correo al comprador con la salida de la
 *     devolución, y gong a Vero para intervenir.
 *
 * Nace del caso de Ana Gabriela (Álgebra de Baldor, 14-09-2026): trece días
 * esperando un libro sin que nadie le avisara nada.
 */
const HORA = 3600_000;

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceRoleClient();
  const ahora = Date.now();
  const resultado = { vendedor: 0, comprador: 0 };

  for (const ventana of [
    { tipo: "vendedor" as const, desde: 72, hasta: 48 },
    { tipo: "comprador" as const, desde: 144, hasta: 120 },
  ]) {
    const { data: ordenes } = await admin
      .from("orders")
      .select(
        "id, bundle_id, buyer_id, seller_id, created_at, shipping_cost, buyer_address, listing:listings(book:books(title))"
      )
      .eq("status", "paid")
      .eq("courier", COURIER_COORDINADO)
      .eq("shipping_status", ESTADO_COORDINADO_PENDIENTE)
      .gte("created_at", new Date(ahora - ventana.desde * HORA).toISOString())
      .lt("created_at", new Date(ahora - ventana.hasta * HORA).toISOString())
      .order("created_at");

    // Agrupar por bundle: un aviso por compra, no por libro.
    const porBundle = new Map<string, any[]>();
    for (const o of ordenes ?? []) {
      const k = o.bundle_id ?? o.id;
      porBundle.set(k, [...(porBundle.get(k) ?? []), o]);
    }

    for (const filas of Array.from(porBundle.values())) {
      const head = filas.find((o) => Number(o.shipping_cost) > 0) ?? filas[0];
      const titulos = filas
        .map((o: any) => (Array.isArray(o.listing) ? o.listing[0] : o.listing)?.book)
        .map((b: any) => (Array.isArray(b) ? b[0] : b)?.title)
        .filter((t: unknown): t is string => typeof t === "string" && t.length > 0);
      const libro = titulos.length > 1 ? `tus ${titulos.length} libros` : titulos[0] ?? "el libro";
      const dias = Math.floor((ahora - new Date(head.created_at).getTime()) / (24 * HORA));

      const [{ data: vendedor }, { data: comprador }] = await Promise.all([
        admin.from("users").select("full_name, email").eq("id", head.seller_id).maybeSingle(),
        admin.from("users").select("full_name, email").eq("id", head.buyer_id).maybeSingle(),
      ]);

      try {
        if (ventana.tipo === "vendedor" && vendedor?.email) {
          const quien = String(vendedor.full_name ?? "").split(" ")[0] || "";
          await sendEmail({
            to: vendedor.email,
            from: "Vero de tuslibros.cl <vero@tuslibros.cl>",
            replyTo: VERO_INBOX,
            subject: `¿Ya despachaste ${libro}?`,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.6">
                <p>Hola ${escapeHtml(quien)}!</p>
                <p>Hace ${dias} días te compraron <strong>${escapeHtml(libro)}</strong> con despacho coordinado, y todavía no aparece el número de seguimiento.</p>
                <p>Si ya lo mandaste, entra a <a href="https://tuslibros.cl/mis-ventas">Mis Ventas</a>, aprieta <strong>Ya lo despaché</strong> y escribe el courier y el número. Con eso le aviso a quien compró.</p>
                <p>Si todavía no sale, llévalo a la sucursal que te acomode y paga el envío a domicilio para ${escapeHtml(String(comprador?.full_name ?? "quien compró"))}${head.buyer_address ? `, ${escapeHtml(head.buyer_address)}` : ""}. La plata del envío ya te llegó con la venta.</p>
                <p>Si hay algún problema, respóndeme este correo y lo resolvemos.</p>
                <p style="margin-top:28px">Vero<br/><span style="color:#777">tuslibros.cl</span></p>
              </div>`,
          });
          resultado.vendedor++;
        }

        if (ventana.tipo === "comprador") {
          if (comprador?.email) {
            const quien = String(comprador.full_name ?? "").split(" ")[0] || "";
            await sendEmail({
              to: comprador.email,
              from: "Vero de tuslibros.cl <vero@tuslibros.cl>",
              replyTo: VERO_INBOX,
              subject: `Tu pedido todavía no sale: ${libro}`,
              html: `
                <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.6">
                  <p>Hola ${escapeHtml(quien)}!</p>
                  <p>Soy Vero, de tuslibros.cl. Compraste <strong>${escapeHtml(libro)}</strong> hace ${dias} días y quien te lo vende todavía no registra el despacho. Ya le avisé.</p>
                  <p>Tienes dos opciones, y la decisión es tuya:</p>
                  <p><strong>Esperar.</strong> No tienes que hacer nada. Apenas lo despache, te llega el número de seguimiento por correo.</p>
                  <p><strong>No esperar más.</strong> Respóndeme este correo y te devuelvo la plata completa.</p>
                  <p>Perdón por la demora.</p>
                  <p style="margin-top:28px">Vero<br/><span style="color:#777">tuslibros.cl</span></p>
                </div>`,
            });
            resultado.comprador++;
          }
          await sendGong(
            `\u{1F534} Despacho coordinado sin registrar hace ${dias} días\n` +
              `${escapeHtml(libro)} · ${escapeHtml(String(vendedor?.full_name ?? "—"))}\n` +
              `Se le avisó al comprador con opción de devolución.`
          );
        }
      } catch (e) {
        console.error("[cron despacho-coordinado]", head.id, e);
      }
    }
  }

  return NextResponse.json({ ok: true, ...resultado });
}
