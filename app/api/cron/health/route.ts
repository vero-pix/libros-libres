import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendGong } from "@/lib/notifications";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/health
 *
 * Chequeo diario de que el sitio sigue en pie. Nació el 27-08-2026, cuando las
 * cuentas de Vercel y Supabase quedaron impagas y una caída habría pasado
 * inadvertida: cuando el dominio venció en agosto, Vero se enteró horas después
 * y porque alguien le escribió.
 *
 * ES UN HEARTBEAT, Y ESO ES DELIBERADO. Este cron corre DENTRO de Vercel, así
 * que no puede avisar que Vercel se cayó: si la cuenta se suspende, el cron
 * tampoco corre. Por eso manda mensaje TODOS los días, esté bien o mal. La
 * señal de alarma no es solo el 🚨 — es también el silencio. Si un día no llega
 * nada, algo pasó con Vercel o con el cron.
 *
 * Protegido por CRON_SECRET. Acepta ?dry=1 para probar sin mandar Telegram.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = new URL(request.url).searchParams.get("dry") === "1";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tuslibros.cl";
  const fallas: string[] = [];
  const lineas: string[] = [];

  // 1. ¿El sitio responde? Se pide la home como la pediría un visitante.
  try {
    const res = await fetch(siteUrl, {
      headers: { "User-Agent": "tuslibros-health" },
      cache: "no-store",
    });
    if (res.ok) lineas.push(`✅ Sitio ${res.status}`);
    else fallas.push(`El sitio responde ${res.status}`);
  } catch (e) {
    fallas.push(`El sitio no responde: ${e instanceof Error ? e.message : "error de red"}`);
  }

  // 2. ¿La base responde y tiene catálogo? Un 0 acá significa Supabase cortado
  //    o RLS roto: el sitio se ve en pie pero vacío, que es igual de terminal.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  let activos = 0;
  try {
    const { count, error } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");
    if (error) fallas.push(`Base de datos: ${error.message}`);
    else {
      activos = count ?? 0;
      if (activos === 0) fallas.push("El catálogo devuelve 0 libros activos");
      else lineas.push(`✅ ${activos.toLocaleString("es-CL")} libros activos`);
    }
  } catch (e) {
    fallas.push(`Base de datos inaccesible: ${e instanceof Error ? e.message : "error"}`);
  }

  // 3. ¿Storage sirve las portadas? Una ficha sin imagen no se vende.
  try {
    const { data } = await supabase
      .from("listings")
      .select("cover_image_url")
      .not("cover_image_url", "is", null)
      .limit(1);
    const url = data?.[0]?.cover_image_url;
    if (url) {
      const res = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (res.ok) lineas.push("✅ Portadas OK");
      else fallas.push(`Storage responde ${res.status} en las portadas`);
    }
  } catch {
    fallas.push("No se pudo verificar el storage de portadas");
  }

  // 4. Órdenes detenidas. No es una caída, pero es plata parada: si el número
  //    sube día a día, el checkout está fallando y hay que mirarlo.
  let pendientes = 0;
  let montoPendiente = 0;
  try {
    const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("orders")
      .select("total, status")
      .eq("status", "pending")
      .gte("created_at", desde);
    pendientes = data?.length ?? 0;
    montoPendiente = (data ?? []).reduce((a, o) => a + (o.total ?? 0), 0);
  } catch {
    /* no es motivo de alarma por sí solo */
  }

  const hoy = new Date().toLocaleDateString("es-CL", { timeZone: "America/Santiago" });
  const mensaje = fallas.length
    ? `🚨 <b>tuslibros.cl — algo está caído</b> (${hoy})\n\n` +
      fallas.map((f) => `• ${f}`).join("\n") +
      (lineas.length ? `\n\nLo que sí funciona:\n${lineas.join("\n")}` : "")
    : `✅ <b>tuslibros.cl operativo</b> (${hoy})\n\n` +
      lineas.join("\n") +
      (pendientes
        ? `\n\n⏸ ${pendientes} ${pendientes === 1 ? "orden detenida" : "órdenes detenidas"} · $${montoPendiente.toLocaleString("es-CL")} sin pagar`
        : "");

  if (!dry) await sendGong(mensaje);

  return NextResponse.json({
    ok: fallas.length === 0,
    fallas,
    activos,
    pendientes,
    montoPendiente,
    mensaje: dry ? mensaje : undefined,
  });
}
