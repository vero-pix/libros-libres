/**
 * POST /api/v1/keys  — Genera una nueva API key para el seller autenticado (vía sesión web)
 * GET  /api/v1/keys  — Lista las API keys del seller (sin mostrar el valor completo)
 * DELETE /api/v1/keys?id=  — Revoca una API key
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const serviceSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

function generateKey(): string {
  return "tl_" + randomBytes(32).toString("hex");
}

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await serviceSupabase()
    .from("api_keys")
    .select("id, name, last_used_at, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let name = "Mi API Key";
  try { const body = await req.json(); name = body.name || name; } catch { /* ok */ }

  const key = generateKey();
  const { data, error } = await serviceSupabase()
    .from("api_keys")
    .insert({ seller_id: user.id, key, name })
    .select("id, name, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Devolvemos la key completa solo una vez — no se puede recuperar después
  return NextResponse.json({ ...data, key }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el parámetro ?id=" }, { status: 400 });

  const { error } = await serviceSupabase()
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
