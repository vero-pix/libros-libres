import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendGong, escapeHtml } from "@/lib/notifications";

function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
  let browser = "Otro";
  let os = "Otro";
  let device = "Desktop";

  // Browser
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  // OS
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  // Device
  if (ua.includes("iPhone") || (ua.includes("Android") && ua.includes("Mobile"))) device = "Mobile";
  else if (ua.includes("iPad") || (ua.includes("Android") && !ua.includes("Mobile"))) device = "Tablet";

  return { browser, os, device };
}

/** POST /api/analytics — log a page view */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { path, referrer, listing_id, session_id } = body;

  if (!path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const ua = req.headers.get("user-agent") ?? "";
  const { browser, os, device } = parseUserAgent(ua);

  // Use service role to bypass RLS for insert
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Try to get user from auth cookie (optional)
  const authSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await authSupabase.auth.getUser();

  await supabase.from("page_views").insert({
    path,
    referrer: referrer || null,
    user_agent: ua.slice(0, 500),
    browser,
    os,
    device,
    user_id: user?.id || null,
    listing_id: listing_id || null,
    session_id: session_id || null,
  });

  // Si el usuario está logueado, backfillar las pageviews previas de esta
  // session que aún no tienen user_id (entradas anónimas antes del login).
  // Esto es lo que nos permite ver "este usuario vino de LinkedIn → navegó
  // X libros → se registró" en lugar de tener dos trayectos desconectados.
  if (user?.id && session_id) {
    await supabase
      .from("page_views")
      .update({ user_id: user.id })
      .eq("session_id", session_id)
      .is("user_id", null);
  }

  // GONG: Notificar si alguien buscó y no encontró nada
  if (path === "/search" && body.results_count === 0 && body.query) {
    const q = body.query.trim();
    if (q.length > 2) {
      sendGong(
        `🔍 <b>Búsqueda sin éxito</b>\n\n` +
        `Alguien buscó: "<b>${escapeHtml(q)}</b>" y no encontró resultados.\n\n` +
        `<a href="https://tuslibros.cl/admin/search-queries">Ver analíticas →</a>`
      ).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
