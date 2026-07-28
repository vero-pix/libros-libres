import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";
import { sendGong, escapeHtml } from "@/lib/notifications";

/**
 * POST /api/encuesta — recibe una respuesta de la encuesta de producto.
 *
 * No requiere login: el link llega por correo y exigir sesión botaría a la mitad.
 * La tabla tiene RLS con insert abierto y lectura solo admin, pero acá igual se
 * escribe con service role para poder asociar el user_id de la sesión cuando
 * existe, sin depender de las cookies del cliente.
 */
export async function POST(req: NextRequest) {
  const { grupo, respuestas, email, company } = (await req.json()) as {
    grupo?: string;
    respuestas?: Record<string, string[] | string>;
    email?: string;
    company?: string;
  };

  // Honeypot: mismo trato que en /api/newsletter — 200 para no darle pistas al
  // bot, pero no se guarda nada.
  if (company && company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  if (grupo !== "vendedor" && grupo !== "no_publico") {
    return NextResponse.json({ error: "Grupo inválido" }, { status: 400 });
  }
  if (!respuestas || typeof respuestas !== "object") {
    return NextResponse.json({ error: "Faltan las respuestas" }, { status: 400 });
  }

  // Una fila sin nada marcado no aporta y ensucia el conteo.
  const tieneAlgo = Object.values(respuestas).some((v) =>
    Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "",
  );
  if (!tieneAlgo) {
    return NextResponse.json({ error: "No hay respuestas" }, { status: 400 });
  }

  // user_id si hay sesión; es opcional a propósito.
  let userId: string | null = null;
  try {
    const sessionClient = await createClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // sin sesión, seguimos igual
  }

  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );

  // `avisos` sale a su propia columna: es la pregunta que decide si el bot de
  // notificaciones se construye, así que conviene poder contarla sin abrir el jsonb.
  const avisos = Array.isArray(respuestas.avisos) ? (respuestas.avisos as string[]) : null;
  const libre = typeof respuestas.libre === "string" ? respuestas.libre.trim() : null;

  const { error } = await admin.from("survey_responses").insert({
    grupo,
    user_id: userId,
    email: email?.toLowerCase().trim() || null,
    respuestas,
    interes_avisos: avisos,
    falta: libre || null,
  });

  if (error) {
    console.error("[encuesta] insert error:", error.message);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }

  // Gong a Vero: con 30 respuestas esperadas, enterarse en el momento vale más
  // que un resumen diario.
  sendGong(
    `📋 <b>Respuesta a la encuesta</b>\n\n` +
      `Grupo: ${grupo === "vendedor" ? "vendedor activo" : "nunca publicó"}\n` +
      (email ? `Correo: ${escapeHtml(email)}\n` : "") +
      (libre ? `\n<i>${escapeHtml(libre.slice(0, 300))}</i>` : ""),
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
