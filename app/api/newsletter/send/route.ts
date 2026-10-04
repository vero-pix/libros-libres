import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendEmail } from "@/lib/email";
import { agregarPieBaja, correosDadosDeBaja, encabezadosBaja } from "@/lib/bajaCorreos";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Only admin can send newsletters
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: esAdmin } = await supabase.rpc("is_admin");

  if (esAdmin !== true) {
    return NextResponse.json({ error: "Solo admin puede enviar newsletters" }, { status: 403 });
  }

  const { subject, html } = (await req.json()) as { subject: string; html: string };

  if (!subject || !html) {
    return NextResponse.json({ error: "Faltan subject o html" }, { status: 400 });
  }

  // Audiencia = unión de usuarios registrados + suscriptores del newsletter,
  // deduplicada por email (normalizado en minúsculas). Así no le llega dos veces
  // a quien está en ambas listas.
  const admin = createServiceRoleClient();
  const [{ data: subscribers }, { data: registered }, bajas] = await Promise.all([
    supabase.from("newsletter_subscribers").select("email"),
    // `users.email` solo con service role (20260923e); ya se comprobó que es admin.
    admin.from("users").select("email"),
    correosDadosDeBaja(admin),
  ]);

  // Sin la lista de bajas no se manda: es preferible un newsletter atrasado a
  // escribirle a quien pidió que no (ley 21.719, lib/bajaCorreos.ts).
  if (!bajas) {
    return NextResponse.json({ error: "No se pudo leer la lista de bajas; no se envió nada" }, { status: 500 });
  }

  const recipients = new Map<string, string>(); // key normalizada → email original
  for (const row of [...(registered ?? []), ...(subscribers ?? [])]) {
    const raw = (row.email ?? "").trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (bajas.has(key)) continue;
    if (!recipients.has(key)) recipients.set(key, raw);
  }

  if (recipients.size === 0) {
    return NextResponse.json({ error: "No hay destinatarios" }, { status: 404 });
  }

  let sent = 0;
  let failed = 0;

  for (const email of Array.from(recipients.values())) {
    try {
      // sendEmail devuelve null cuando no sale (el detalle queda en email_log).
      const r = await sendEmail({ to: email, subject, html: agregarPieBaja(html, email), headers: encabezadosBaja(email) });
      if (r) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: recipients.size, bajasEnLista: bajas.size });
}
