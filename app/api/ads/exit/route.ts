import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/ads/exit — registra que alguien hizo clic en un bloque de AdSense.
 *
 * Nació el 11-09-2026 para medir el experimento de Vero: ella mantiene los
 * anuncios apostando a que quien sale ve el mismo libro más caro en otro sitio
 * y vuelve. Sin este registro la apuesta no se puede ganar ni perder.
 *
 * El clic se detecta en el cliente por foco del iframe (ver AdSlot). Google no
 * expone quién hizo clic, así que esto es una aproximación: cuenta salidas
 * hacia el anuncio, no clics confirmados por AdSense. Los totales no van a
 * calzar exactamente con el panel y está bien — lo que importa es el regreso.
 */
export async function POST(req: NextRequest) {
  let body: { visitor_id?: string; session_id?: string; path?: string; slot?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "cuerpo inválido" }, { status: 400 });
  }

  const { visitor_id, session_id, path, slot } = body;
  if (!visitor_id || !path) {
    return NextResponse.json({ error: "visitor_id y path son obligatorios" }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await admin.from("ad_exits").insert({
    visitor_id: String(visitor_id).slice(0, 64),
    session_id: session_id ? String(session_id).slice(0, 64) : null,
    path: String(path).slice(0, 300),
    slot: slot ? String(slot).slice(0, 32) : null,
  });

  if (error) {
    console.error("[ads/exit] no se registró la salida:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
