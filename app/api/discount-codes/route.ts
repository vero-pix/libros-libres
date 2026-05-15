import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/discount-codes — valida un código y devuelve el % de descuento
export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code?.trim()) {
    return NextResponse.json({ error: "Código vacío" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from("discount_codes")
    .select("id, code, discount_pct, max_uses, uses_count, active, expires_at, description")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Código no válido" }, { status: 404 });
  }

  if (!data.active) {
    return NextResponse.json({ error: "Este código ya no está activo" }, { status: 400 });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Este código expiró" }, { status: 400 });
  }

  if (data.max_uses !== null && data.uses_count >= data.max_uses) {
    return NextResponse.json({ error: "Este código ya alcanzó su límite de usos" }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    code: data.code,
    discount_pct: data.discount_pct,
    description: data.description,
  });
}
