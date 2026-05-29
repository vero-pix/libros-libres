import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Only admin can send newsletters
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Solo admin puede enviar newsletters" }, { status: 403 });
  }

  const { subject, html } = (await req.json()) as { subject: string; html: string };

  if (!subject || !html) {
    return NextResponse.json({ error: "Faltan subject o html" }, { status: 400 });
  }

  // Audiencia = unión de usuarios registrados + suscriptores del newsletter,
  // deduplicada por email (normalizado en minúsculas). Así no le llega dos veces
  // a quien está en ambas listas.
  const [{ data: subscribers }, { data: registered }] = await Promise.all([
    supabase.from("newsletter_subscribers").select("email"),
    supabase.from("users").select("email"),
  ]);

  const recipients = new Map<string, string>(); // key normalizada → email original
  for (const row of [...(registered ?? []), ...(subscribers ?? [])]) {
    const raw = (row.email ?? "").trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (!recipients.has(key)) recipients.set(key, raw);
  }

  if (recipients.size === 0) {
    return NextResponse.json({ error: "No hay destinatarios" }, { status: 404 });
  }

  let sent = 0;
  let failed = 0;

  for (const email of Array.from(recipients.values())) {
    try {
      await sendEmail({ to: email, subject, html });
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: recipients.size });
}
