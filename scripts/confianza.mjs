#!/usr/bin/env node
/**
 * Administración de "Librerías de confianza" — paso g) de
 * docs/prompts/librerias-confianza-resenas.md.
 *
 * Es un script de línea de comandos a propósito: no hay panel de admin y no
 * valía la pena construir uno para dos operaciones que se hacen de vez en
 * cuando. Escribe con el service_role, que es el único que puede ocultar una
 * reseña y tocar site_config.
 *
 *   node scripts/confianza.mjs estado
 *   node scripts/confianza.mjs resenas [vendedor] [--todas]
 *   node scripts/confianza.mjs ocultar <idReseña> "motivo"
 *   node scripts/confianza.mjs mostrar <idReseña>
 *   node scripts/confianza.mjs semana <vendedor> [--hasta AAAA-MM-DD] [--frase "..."]
 *   node scripts/confianza.mjs semana --auto
 *   node scripts/confianza.mjs casa --frase "..."   |   casa --off  |  casa --on
 *   node scripts/confianza.mjs destacado <tag> --titulo "..." [--subtitulo "..."]
 *                                              [--coleccion <slug>] [--hasta AAAA-MM-DD]
 *   node scripts/confianza.mjs destacado --auto
 *
 * Ojo: la portada del home cachea 5 minutos (unstable_cache), así que un cambio
 * de frase o de tienda de la semana tarda hasta ese rato en verse.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const linea of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = linea.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const args = process.argv.slice(2);
const cmd = args[0];
const opcion = (k) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : null;
};
const tiene = (k) => args.includes(`--${k}`);
const sueltos = args.slice(1).filter((a, i, arr) => !a.startsWith("--") && !(i > 0 && arr[i - 1]?.startsWith("--")));

function salir(msg) {
  console.error(msg);
  process.exit(1);
}

async function leerConfig(key) {
  const { data } = await admin.from("site_config").select("value").eq("key", key).maybeSingle();
  return data?.value ?? {};
}

async function escribirConfig(key, value) {
  const { error } = await admin
    .from("site_config")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) salir(`No se pudo guardar ${key}: ${error.message}`);
}

async function porUsername(username) {
  const { data } = await admin.from("users").select("id, username, full_name").eq("username", username).maybeSingle();
  return data;
}

/** Tras ocultar o mostrar una reseña hay que recalcular el promedio del vendedor. */
async function refrescar(sellerId) {
  const { error } = await admin.rpc("refresh_seller_stats", { p_seller_id: sellerId });
  if (error) console.warn(`  (aviso: no se pudo refrescar seller_stats: ${error.message})`);
  else console.log("  seller_stats recalculado para ese vendedor.");
}

/* ─────────────────────────────── estado ─────────────────────────────── */

if (cmd === "estado" || !cmd) {
  const casa = await leerConfig("casa_slot");
  const semana = await leerConfig("tienda_semana");
  const nombre = async (id) => (id ? (await admin.from("users").select("username").eq("id", id).maybeSingle()).data?.username ?? id : "—");

  console.log("SELECCIÓN DE LA CASA");
  console.log(`  vendedor : ${await nombre(casa.seller_id)}`);
  console.log(`  activo   : ${casa.activo ? "sí" : "no"}`);
  console.log(`  frase    : ${casa.frase ? `"${casa.frase}"` : "(vacía, no se muestra)"}`);

  const hoy = new Date().toISOString().slice(0, 10);
  const vigente = semana.seller_id && (!semana.until || semana.until >= hoy);
  console.log("\nTIENDA DE LA SEMANA");
  console.log(`  vendedor : ${await nombre(semana.seller_id)}${vigente ? "" : "  (vencida o vacía → toma el mejor score)"}`);
  console.log(`  hasta    : ${semana.until ?? "—"}`);
  console.log(`  frase    : ${semana.frase ? `"${semana.frase}"` : "(vacía, no se muestra)"}`);
  console.log(`  anterior : ${await nombre(semana.anterior)}   (no se puede repetir)`);

  const { data: tiendas } = await admin
    .from("seller_stats")
    .select("trust_score, paid_total, seller:users(username)")
    .eq("is_trusted", true)
    .order("trust_score", { ascending: false });
  console.log(`\nCALIFICAN HOY (${tiendas?.length ?? 0})`);
  for (const t of tiendas ?? []) {
    const u = Array.isArray(t.seller) ? t.seller[0] : t.seller;
    console.log(`  ${String(t.trust_score).padStart(6)}  ${u?.username ?? "?"}  (${t.paid_total} ${t.paid_total === 1 ? "venta" : "ventas"})`);
  }

  const { count } = await admin.from("reviews").select("id", { count: "exact", head: true });
  const { count: ocultas } = await admin
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .not("hidden_at", "is", null);
  console.log(`\nRESEÑAS: ${count ?? 0} en total, ${ocultas ?? 0} ocultas.`);
  process.exit(0);
}

/* ─────────────────────────────── reseñas ─────────────────────────────── */

if (cmd === "resenas") {
  let q = admin
    .from("reviews")
    .select("id, rating, comment, created_at, hidden_at, hidden_reason, seller:users!reviews_seller_id_fkey(username), reviewer:users!reviews_reviewer_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(40);
  if (sueltos[0]) {
    const v = await porUsername(sueltos[0]);
    if (!v) salir(`No existe el vendedor "${sueltos[0]}".`);
    q = q.eq("seller_id", v.id);
  }
  if (!tiene("todas")) q = q.is("hidden_at", null);

  const { data, error } = await q;
  if (error) salir(error.message);
  if (!data?.length) {
    console.log("Sin reseñas para ese filtro.");
    process.exit(0);
  }
  for (const r of data) {
    const s = Array.isArray(r.seller) ? r.seller[0] : r.seller;
    const c = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer;
    const estado = r.hidden_at ? `  [OCULTA: ${r.hidden_reason ?? "sin motivo"}]` : "";
    console.log(`\n${r.id}${estado}`);
    console.log(`  ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}  a ${s?.username ?? "?"} · por ${c?.full_name ?? "?"} · ${r.created_at.slice(0, 10)}`);
    if (r.comment) console.log(`  "${r.comment}"`);
  }
  process.exit(0);
}

/* ──────────────────────── ocultar / mostrar reseña ──────────────────────── */

if (cmd === "ocultar" || cmd === "mostrar") {
  const id = sueltos[0];
  if (!id) salir(`Falta el id de la reseña.  node scripts/confianza.mjs ${cmd} <id> ${cmd === "ocultar" ? '"motivo"' : ""}`);

  const { data: r } = await admin.from("reviews").select("id, seller_id, hidden_at").eq("id", id).maybeSingle();
  if (!r) salir(`No existe la reseña ${id}.`);

  if (cmd === "ocultar") {
    const motivo = sueltos[1];
    // El motivo es obligatorio: una reseña se oculta por spam, datos personales
    // o incumplimiento de los términos, nunca por ser negativa. Dejarlo escrito
    // es lo que permite revisar la decisión después.
    if (!motivo) salir('Falta el motivo. Ej: node scripts/confianza.mjs ocultar <id> "trae el teléfono del comprador"');
    const { error } = await admin
      .from("reviews")
      .update({ hidden_at: new Date().toISOString(), hidden_reason: motivo })
      .eq("id", id);
    if (error) salir(error.message);
    console.log(`Reseña ${id} oculta. Motivo: "${motivo}".`);
    console.log("  La fila NO se borró: se puede volver a mostrar.");
  } else {
    const { error } = await admin.from("reviews").update({ hidden_at: null, hidden_reason: null }).eq("id", id);
    if (error) salir(error.message);
    console.log(`Reseña ${id} visible de nuevo.`);
  }
  await refrescar(r.seller_id);
  process.exit(0);
}

/* ────────────────────────── tienda de la semana ────────────────────────── */

if (cmd === "semana") {
  const actual = await leerConfig("tienda_semana");

  if (tiene("auto")) {
    await escribirConfig("tienda_semana", { ...actual, seller_id: null, until: null, frase: "" });
    console.log("Tienda de la semana en automático: toma el mejor score que no sea la anterior ni libro.de.ocasion.");
    process.exit(0);
  }

  const username = sueltos[0];
  if (!username) salir('Falta el vendedor. Ej: node scripts/confianza.mjs semana cimlibros --frase "..." --hasta 2026-09-15');
  const v = await porUsername(username);
  if (!v) salir(`No existe el vendedor "${username}".`);

  if (v.id === actual.anterior) {
    salir(`${username} fue la tienda de la semana anterior y no puede repetir dos semanas seguidas.`);
  }

  const { data: stat } = await admin.from("seller_stats").select("is_trusted").eq("seller_id", v.id).maybeSingle();
  if (!stat?.is_trusted) {
    console.warn(`  Aviso: ${username} no califica hoy por el criterio automático. Se fija igual, porque es una decisión editorial.`);
  }

  const frase = opcion("frase") ?? actual.frase ?? "";
  if (frase.length > 120) salir(`La frase tiene ${frase.length} caracteres y el tope son 120.`);

  // Por defecto, una semana desde hoy.
  const hasta = opcion("hasta") ?? new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(hasta)) salir(`Fecha inválida: "${hasta}". Formato AAAA-MM-DD.`);

  await escribirConfig("tienda_semana", {
    seller_id: v.id,
    until: hasta,
    frase,
    // Al cambiar de tienda, la que sale pasa a ser "anterior" y queda vetada
    // para la siguiente vuelta.
    anterior: actual.seller_id ?? actual.anterior ?? null,
  });
  console.log(`Tienda de la semana: ${v.full_name} (${username}), hasta el ${hasta}.`);
  if (frase) console.log(`  Frase: "${frase}"`);
  console.log("  Se ve en el home dentro de 5 minutos (caché de la portada).");
  process.exit(0);
}

/* ──────────────────── primera fila de colecciones del home ──────────────────── */

if (cmd === "destacado") {
  const actual = await leerConfig("destacado_home");

  if (tiene("auto") || tiene("off")) {
    await escribirConfig("destacado_home", {});
    console.log("Primera fila del home: vuelve a la configuración estática del código.");
    process.exit(0);
  }

  const tag = sueltos[0];
  if (!tag) {
    salir(
      'Falta el tag.\n' +
        '  node scripts/confianza.mjs destacado literatura-chilena --titulo "Para el 18" \\\n' +
        '       --subtitulo "Escritoras y escritores de acá, para leer estos días" \\\n' +
        '       --coleccion literatura-chilena --hasta 2026-09-18\n' +
        '  node scripts/confianza.mjs destacado --auto     (vuelve a lo estático)'
    );
  }

  // El tag tiene que existir en el catálogo, y con al menos 3 libros: bajo eso
  // la fila no se muestra y el cambio pasaría inadvertido.
  const { data: libros, error: eLibros } = await admin
    .from("listings")
    .select("id, book:books!inner(tags)", { count: "exact", head: false })
    .eq("status", "active")
    .neq("deprioritized", true)
    .contains("book.tags", [tag])
    .limit(50);
  if (eLibros) salir(eLibros.message);
  const n = libros?.length ?? 0;
  if (n < 3) salir(`El tag "${tag}" tiene ${n} libro(s) activos y la fila necesita al menos 3. No se guardó nada.`);

  if (n === 3) console.warn(`  Aviso: "${tag}" tiene justo 3 libros, el mínimo para que la fila aparezca.`);

  // El título y el subtítulo solo se heredan si NO cambia el tag: arrastrar el
  // subtítulo de una colección a otra deja la fila diciendo cualquier cosa.
  const mismoTag = actual.tag === tag;
  const titulo = opcion("titulo") ?? (mismoTag ? actual.title : null);
  if (!titulo) salir('Falta --titulo "..."');
  const subtitulo = opcion("subtitulo") ?? (mismoTag ? actual.subtitle ?? "" : "");
  const coleccion = opcion("coleccion") ?? null;
  const hasta = opcion("hasta") ?? null;
  if (hasta && !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) salir(`Fecha inválida: "${hasta}". Formato AAAA-MM-DD.`);

  await escribirConfig("destacado_home", {
    tag,
    collectionSlug: coleccion,
    title: titulo,
    subtitle: subtitulo,
    until: hasta,
  });
  console.log(`Primera fila del home: "${titulo}"`);
  if (subtitulo) console.log(`  Subtítulo: "${subtitulo}"`);
  console.log(`  Tag: ${tag} (${n >= 50 ? "50+" : n} libros activos)`);
  console.log(`  Ver todo: ${coleccion ? `/coleccion/${coleccion}` : `/?tag=${tag}`}`);
  console.log(`  Vigente hasta: ${hasta ?? "sin fecha (hasta que se cambie)"}`);
  console.log("  Se ve en el home dentro de 5 minutos (caché de la portada).");
  process.exit(0);
}

/* ───────────────────────── selección de la casa ───────────────────────── */

if (cmd === "casa") {
  const actual = await leerConfig("casa_slot");
  if (tiene("off") || tiene("on")) {
    await escribirConfig("casa_slot", { ...actual, activo: tiene("on") });
    console.log(`Selección de la casa: ${tiene("on") ? "visible" : "oculta"}.`);
    process.exit(0);
  }
  const frase = opcion("frase");
  if (frase == null) salir('Falta qué cambiar. Ej: node scripts/confianza.mjs casa --frase "Lo que estoy leyendo yo"  |  casa --off');
  if (frase.length > 120) salir(`La frase tiene ${frase.length} caracteres y el tope son 120.`);
  await escribirConfig("casa_slot", { ...actual, frase });
  console.log(`Frase de la casa: "${frase}"`);
  console.log("  Se ve en el home dentro de 5 minutos (caché de la portada).");
  process.exit(0);
}

salir(`Comando desconocido: "${cmd}".\n\n${readFileSync(new URL(import.meta.url)).toString().split("\n").slice(11, 20).map((l) => l.replace(/^ \* ?/, "")).join("\n")}`);
