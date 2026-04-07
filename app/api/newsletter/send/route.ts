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

  // Get all subscribers
  const { data: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("email");

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ error: "No hay suscriptores" }, { status: 404 });
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      await sendEmail({
        to: sub.email,
        subject,
        html,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: subscribers.length });
}
