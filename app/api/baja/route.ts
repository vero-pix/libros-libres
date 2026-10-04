import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { darDeBaja, decodificarCorreo, verificarBaja } from "@/lib/bajaCorreos";

export const dynamic = "force-dynamic";

/**
 * /api/baja — ver lib/bajaCorreos.ts.
 *
 * GET no da de baja a nadie: los antivirus y los filtros de correo abren los
 * links para revisarlos, y si el GET bastara se darían de baja solos. Manda a
 * la página /baja, que pide confirmar.
 *
 * POST sí da de baja, en dos formas:
 *   - el formulario de /baja (campos `e` y `t`), que vuelve a la página;
 *   - el botón del cliente de correo (RFC 8058: `List-Unsubscribe=One-Click`
 *     en el cuerpo, `e` y `t` en la URL), que solo espera un 200.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/baja";
  return NextResponse.redirect(url, 303);
}

export async function POST(req: NextRequest) {
  const qs = req.nextUrl.searchParams;
  let e = qs.get("e");
  let t = qs.get("t");
  let oneClick = false;

  try {
    const form = await req.formData();
    oneClick = form.get("List-Unsubscribe") === "One-Click";
    e = (form.get("e") as string | null) ?? e;
    t = (form.get("t") as string | null) ?? t;
  } catch {
    // Sin cuerpo de formulario: vale lo que venga en la URL.
  }

  const email = decodificarCorreo(e);
  const valido = !!email && verificarBaja(email, t);
  const ok = valido && (await darDeBaja(createServiceRoleClient(), email!));

  if (oneClick) {
    return new NextResponse(ok ? "ok" : "link inválido", { status: ok ? 200 : 400 });
  }

  const destino = req.nextUrl.clone();
  destino.pathname = "/baja";
  destino.search = ok ? "?listo=1" : valido ? "?error=1" : "?invalido=1";
  return NextResponse.redirect(destino, 303);
}
