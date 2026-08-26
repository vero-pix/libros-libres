/**
 * ¿De dónde llega la gente y qué hace después?
 *
 * Lee los UTM que quedan guardados en `page_views.path` y sigue el rastro hasta
 * el carrito y la orden pagada. Correr semanal, igual que `scripts/_captura.mjs`.
 *
 *   node scripts/social-atribucion.mjs             → últimos 30 días
 *   node scripts/social-atribucion.mjs --dias 7
 *
 * Contexto: los 14 posts de julio salieron sin ningún parámetro y por eso no se
 * pudo saber si Instagram servía. Desde el 26 ago 2026 los generadores etiquetan
 * solo (`lib/utm.ts`).
 *
 * ⚠️ Ojo al leer: el tráfico de Instagram que llega a /vendedor/buhardilla trae
 * `utm_source=ig`. Esos NO son nuestros — los pone Buhardilla en su cuenta. Los
 * nuestros dicen `instagram`.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const i = process.argv.indexOf("--dias");
const DIAS = i > -1 ? parseInt(process.argv[i + 1], 10) : 30;
const desde = new Date(Date.now() - DIAS * 86400000).toISOString();

async function pag(tabla, cols, extra) {
  const out = [];
  for (let f = 0; ; f += 1000) {
    let q = s.from(tabla).select(cols).range(f, f + 999);
    if (extra) q = extra(q);
    const { data, error } = await q;
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

const vistas = await pag("page_views", "path, session_id, user_id, created_at", (q) =>
  q.gte("created_at", desde)
);

const parseUtm = (path) => {
  const qs = (path ?? "").split("?")[1];
  if (!qs) return null;
  const p = new URLSearchParams(qs);
  const src = p.get("utm_source");
  if (!src) return null;
  return { source: src, medium: p.get("utm_medium") ?? "—", campaign: p.get("utm_campaign") ?? "—" };
};

// Una sesión se atribuye a la PRIMERA fuente con la que llegó.
const sesionFuente = new Map();
const porFuente = new Map();
for (const v of [...vistas].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
  const u = parseUtm(v.path);
  if (!u || !v.session_id) continue;
  if (!sesionFuente.has(v.session_id)) sesionFuente.set(v.session_id, u);
  const clave = `${u.source} · ${u.campaign}`;
  if (!porFuente.has(clave))
    porFuente.set(clave, { source: u.source, campaign: u.campaign, vistas: 0, sesiones: new Set(), rutas: {} });
  const f = porFuente.get(clave);
  f.vistas++;
  f.sesiones.add(v.session_id);
  const ruta = (v.path ?? "").split("?")[0];
  f.rutas[ruta] = (f.rutas[ruta] ?? 0) + 1;
}

// ¿Esas sesiones llegaron al carrito? Se cruza por usuario, que es lo que
// comparten page_views y cart_items.
const usuariosPorSesion = new Map();
for (const v of vistas) {
  if (v.session_id && v.user_id) usuariosPorSesion.set(v.session_id, v.user_id);
}
const carritos = await pag("cart_items", "user_id, added_at", (q) => q.gte("added_at", desde));
const ordenes = await pag("orders", "buyer_id, status, total, mercadopago_payment_id, created_at", (q) =>
  q.gte("created_at", desde)
);
const conCarrito = new Set(carritos.map((c) => c.user_id));
const conOrdenPagada = new Set(
  ordenes
    .filter((o) => o.mercadopago_payment_id && !["cancelled", "refunded"].includes(o.status ?? ""))
    .map((o) => o.buyer_id)
);

console.log(`═══ ATRIBUCIÓN POR UTM · últimos ${DIAS} días ═══\n`);
if (!porFuente.size) {
  console.log("  Ninguna visita trae UTM en la ventana.");
  console.log("  Si acabas de etiquetar los links, es normal: aparecen cuando alguien los use.\n");
} else {
  console.log("  fuente · campaña".padEnd(42), "sesiones".padStart(9), "vistas".padStart(7), "carrito".padStart(8), "compró".padStart(7));
  for (const f of [...porFuente.values()].sort((a, b) => b.sesiones.size - a.sesiones.size)) {
    const usuarios = [...f.sesiones].map((sid) => usuariosPorSesion.get(sid)).filter(Boolean);
    const nCarrito = usuarios.filter((u) => conCarrito.has(u)).length;
    const nCompra = usuarios.filter((u) => conOrdenPagada.has(u)).length;
    console.log(
      `  ${`${f.source} · ${f.campaign}`.slice(0, 40).padEnd(40)}`,
      String(f.sesiones.size).padStart(9),
      String(f.vistas).padStart(7),
      String(nCarrito).padStart(8),
      String(nCompra).padStart(7)
    );
    const top = Object.entries(f.rutas).sort((a, b) => b[1] - a[1]).slice(0, 3);
    for (const [r, n] of top) console.log(`      ${String(n).padStart(4)} → ${r.slice(0, 58)}`);
  }
}

// Referrers sin UTM, para ver cuánto tráfico social queda sin etiquetar
const socialSinUtm = vistas.filter(
  (v) => !parseUtm(v.path) && /instagram|facebook|reddit|t\.co|linkedin/i.test(v.path ?? "")
);
console.log(`\n  Nota: las visitas sin UTM caen en "directo" y no se pueden atribuir.`);
console.log(`  Etiquetar el link de la bio de Instagram es lo que más cambia ese número.`);
