import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  leerTarifasPropias,
  COURIERS_PERFIL,
  DIAS_DESPACHO_MIN,
  DIAS_DESPACHO_MAX,
  TARIFA_PROPIA_MIN,
  TARIFA_PROPIA_MAX,
} from "@/lib/shipping/coordinado";

export const runtime = "nodejs";

/**
 * POST /api/perfil/despacho
 *
 * Guarda el perfil de despacho del vendedor (07-10-2026). Las columnas no se
 * conceden a authenticated (20261007b_users_perfil_despacho.sql), así que esto
 * no puede ir directo desde el navegador como el resto del perfil: verifica la
 * sesión y escribe con service role, solo en la fila del propio usuario.
 *
 * Body: { couriers: string[], dias: number, coordinadoActivo: boolean,
 *         tarifas: { santiago, misma_region, otra_region, extremos } | null }
 * `tarifas: null` = usar las de tuslibros.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tienes que iniciar sesión." }, { status: 401 });
  }

  let body: { couriers?: unknown; dias?: unknown; coordinadoActivo?: unknown; tarifas?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "No pude leer lo que mandaste." }, { status: 400 });
  }

  const validos = new Set<string>(COURIERS_PERFIL.map((c) => c.value));
  const couriers = Array.isArray(body.couriers)
    ? Array.from(new Set(body.couriers.filter((c): c is string => typeof c === "string" && validos.has(c))))
    : [];

  const dias = Number(body.dias);
  if (!Number.isInteger(dias) || dias < DIAS_DESPACHO_MIN || dias > DIAS_DESPACHO_MAX) {
    return NextResponse.json(
      { error: `Los días para despachar tienen que ser un número entre ${DIAS_DESPACHO_MIN} y ${DIAS_DESPACHO_MAX}.` },
      { status: 400 }
    );
  }

  let tarifas = null;
  if (body.tarifas != null) {
    tarifas = leerTarifasPropias(body.tarifas);
    if (!tarifas) {
      return NextResponse.json(
        {
          error: `Cada tarifa tiene que ser un número entero entre $${TARIFA_PROPIA_MIN.toLocaleString("es-CL")} y $${TARIFA_PROPIA_MAX.toLocaleString("es-CL")}.`,
        },
        { status: 400 }
      );
    }
  }

  const { error } = await createServiceRoleClient()
    .from("users")
    .update({
      despacho_couriers: couriers,
      despacho_dias: dias,
      coordinado_activo: body.coordinadoActivo !== false,
      coordinado_tarifas: tarifas,
    })
    .eq("id", user.id);

  if (error) {
    // 42703 = columna inexistente: la migración 20261007b todavía no se aplica.
    const sinMigracion = error.code === "42703" || /column .* does not exist/i.test(error.message);
    return NextResponse.json(
      { error: sinMigracion ? "Esta sección todavía no está lista. Vuelve a intentarlo más tarde." : "No se pudo guardar. Inténtalo de nuevo." },
      { status: sinMigracion ? 503 : 500 }
    );
  }

  return NextResponse.json({ ok: true, couriers, dias, coordinadoActivo: body.coordinadoActivo !== false, tarifas });
}
