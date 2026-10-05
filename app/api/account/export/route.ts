import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { recopilarMisDatos } from "@/lib/misDatos";
import { renderMisDatosHtml } from "@/lib/misDatosHtml";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/account/export?formato=html|json
 *
 * "Descargar mis datos" (Ley 21.719, portabilidad). Los datos se juntan una
 * sola vez en `lib/misDatos.ts` y salen en dos formatos:
 *  - `formato=html`: `mis-datos-tuslibros.html`, legible para cualquiera, que
 *    se abre con doble clic y se imprime o guarda como PDF desde el navegador.
 *    Es lo que baja el botón principal de /perfil.
 *  - `formato=json` (o sin parámetro, como antes): `mis-datos-tuslibros.json`,
 *    la versión técnica y estructurada.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tienes que iniciar sesión." }, { status: 401 });
  }

  const formato = req.nextUrl.searchParams.get("formato") === "html" ? "html" : "json";

  try {
    const datos = await recopilarMisDatos(createServiceRoleClient(), user);

    if (formato === "html") {
      return new NextResponse(renderMisDatosHtml(datos), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": 'attachment; filename="mis-datos-tuslibros.html"',
          "Cache-Control": "no-store",
          // Si alguien lo abre directo desde la URL, que el navegador no ejecute nada.
          "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return new NextResponse(JSON.stringify(datos, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mis-datos-tuslibros.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error(`[account/export] ${user.id}:`, e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "No pude armar el archivo. Prueba de nuevo en un rato; si sigue fallando, escríbeme." },
      { status: 500 }
    );
  }
}
