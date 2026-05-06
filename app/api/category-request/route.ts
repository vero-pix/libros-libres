import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendGong, escapeHtml } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { suggestion } = await req.json();
  if (!suggestion?.trim()) {
    return NextResponse.json({ error: "Falta la sugerencia" }, { status: 400 });
  }

  const userName = user
    ? (await supabase.from("users").select("full_name, email").eq("id", user.id).single()).data?.full_name ?? "usuario logueado"
    : "anónimo";

  sendGong(
    `📂 <b>Sugerencia de categoría</b>\n\n` +
    `<b>Categoría sugerida:</b> ${escapeHtml(suggestion.trim())}\n` +
    `<b>De:</b> ${escapeHtml(userName)}`
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
