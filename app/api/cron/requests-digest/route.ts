import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/requests-digest
 *
 * Un solo correo diario a los vendedores con las solicitudes del "Se busca" de
 * las últimas 24 horas.
 *
 * Antes cada solicitud disparaba su propio envío a TODOS los vendedores activos
 * desde POST /api/requests. Con 87 destinatarios, una sola solicitud se comía
 * 87 de los 100 correos diarios del plan de Resend, y entraban ~2,3 al día: la
 * cuota se agotaba sola, dejando caer avisos de venta y recuperaciones de clave.
 * La noche del 6-08-2026 un comprador pidió 11 libros seguidos — cerca de 950
 * correos, y once notificaciones casi idénticas para cada vendedor.
 *
 * Agrupado: un envío al día, 87 correos, y el vendedor ve todas las solicitudes
 * juntas en vez de once interrupciones.
 *
 * Protegido por CRON_SECRET. Acepta ?dry=1 para simular sin enviar.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 });
  }

  const params = new URL(request.url).searchParams;
  const dry = params.get("dry") === "1";
  // La ventana es de 24h porque el cron corre una vez al día. `?horas=` existe
  // para poder probar el correo contra solicitudes reales sin esperar a que
  // entre una nueva.
  const horas = Math.min(Number(params.get("horas")) || 24, 24 * 30);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const desde = new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();

  const { data: requests, error } = await supabase
    .from("book_requests")
    .select("id, title, author, notes, requester_location, created_at")
    .eq("fulfilled", false)
    .gte("created_at", desde)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!requests?.length) {
    return NextResponse.json({ ok: true, skipped: "sin solicitudes nuevas" });
  }

  // Vendedores con al menos un libro activo. Paginado: el catálogo pasó las
  // 1.700 filas y sin `.range()` Supabase corta en 1000, dejando fuera a los
  // vendedores cuyos libros quedaron al final de la tabla.
  const seen = new Set<string>();
  for (let pos = 0; ; pos += 1000) {
    const { data, error: e } = await supabase
      .from("listings")
      .select("seller_id")
      .eq("status", "active")
      .range(pos, pos + 999);
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    if (!data?.length) break;
    for (const l of data) if (l.seller_id) seen.add(l.seller_id);
    if (data.length < 1000) break;
  }
  const sellerIds = Array.from(seen);
  if (!sellerIds.length) {
    return NextResponse.json({ ok: true, skipped: "sin vendedores activos" });
  }

  const { data: users } = await supabase
    .from("users")
    .select("id, email, on_vacation")
    .in("id", sellerIds);

  const destinatarios = (users ?? []).filter(
    (u) => u.email && u.email !== "vero@tuslibros.cl" && !u.on_vacation
  );

  const plural = requests.length === 1;
  const subject = plural
    ? `Alguien busca "${requests[0].title}" — tuslibros.cl`
    : `${requests.length} libros que la gente anda buscando — tuslibros.cl`;

  const filas = requests
    .map((r) => {
      const publishUrl = `https://tuslibros.cl/publish?title=${encodeURIComponent(r.title)}${r.author ? `&author=${encodeURIComponent(r.author)}` : ""}`;
      return `
      <tr>
        <td style="padding:14px 0; border-bottom:1px solid #efe7d4;">
          <p style="font-family:Georgia,serif; font-size:18px; color:#1c1c1c; margin:0 0 3px; line-height:1.3;">${escapeHtml(r.title)}</p>
          ${r.author ? `<p style="font-style:italic; color:#6b5b42; font-size:14px; margin:0 0 4px;">${escapeHtml(r.author)}</p>` : ""}
          ${r.requester_location ? `<p style="color:#8a6d2e; font-weight:600; font-size:12px; margin:2px 0 0;">📍 ${escapeHtml(r.requester_location)}</p>` : ""}
          ${r.notes ? `<p style="color:#6b6b6b; font-size:12px; margin:6px 0 0;">${escapeHtml(r.notes)}</p>` : ""}
          <a href="${publishUrl}" style="display:inline-block; margin-top:8px; color:#8a6d2e; font-size:13px; font-weight:600; text-decoration:none;">Lo tengo, publicarlo →</a>
        </td>
      </tr>`;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="es-CL">
<body style="margin:0; padding:0; background:#f5f1e8; font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <div style="max-width:540px; margin:0 auto; padding:32px 20px;">

    <p style="color:#9a8a6e; font-size:11px; text-transform:uppercase; letter-spacing:0.3em; font-weight:600; margin:0 0 8px;">
      Economía inversa · Se busca
    </p>

    <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size:26px; color:#1c1c1c; line-height:1.2; margin:0 0 6px;">
      ${plural ? "Alguien está buscando un libro" : `${requests.length} libros que alguien anda buscando`}
    </h1>
    <p style="color:#6b6b6b; font-size:14px; margin:0 0 4px;">
      ${plural ? "Lo pidieron" : "Los pidieron"} en las últimas 24 horas. Si ${plural ? "lo tienes" : "tienes alguno"} en tu estantería, es una venta que ya tiene comprador.
    </p>

    <table style="width:100%; border-collapse:collapse; margin:18px 0;">
      ${filas}
    </table>

    <p style="margin:24px 0;">
      <a href="https://tuslibros.cl/solicitudes"
         style="display:inline-block; background:#8a6d2e; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:6px; font-size:14px; font-weight:600; letter-spacing:0.02em;">
        Ver todas las solicitudes →
      </a>
    </p>

    <hr style="border:none; border-top:1px solid #e5ddc8; margin:26px 0;" />

    <p style="color:#8a8a8a; font-size:12px; line-height:1.5; margin:0;">
      Recibes este resumen porque tienes al menos un libro publicado en tuslibros.cl. Va una vez al día, solo cuando hay pedidos nuevos.
    </p>
    <p style="color:#b5b5b5; font-size:11px; margin:10px 0 0;">
      — Vero, tuslibros.cl
    </p>
  </div>
</body>
</html>`;

  // `?preview=1` devuelve el correo tal cual, para revisarlo en el navegador
  // sin mandárselo a 87 personas. Apple Mail destroza el HTML si se prueba
  // reenviando desde el cliente, así que se mira acá.
  if (params.get("preview") === "1") {
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (dry) {
    return NextResponse.json({
      ok: true,
      dry: true,
      solicitudes: requests.length,
      destinatarios: destinatarios.length,
      subject,
    });
  }

  const results = await Promise.allSettled(
    destinatarios.map((u) => sendEmail({ to: u.email!, subject, html }))
  );
  const ok = results.filter((r) => r.status === "fulfilled" && r.value).length;

  console.log(
    `[requests-digest] ${requests.length} solicitudes → ${ok}/${destinatarios.length} enviados`
  );

  return NextResponse.json({
    ok: true,
    solicitudes: requests.length,
    enviados: ok,
    fallidos: results.length - ok,
  });
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
