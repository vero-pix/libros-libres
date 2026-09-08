/**
 * P16-A — Correo de activación al núcleo duro que intentó vender y no vendió.
 * Base: docs_desde_claude/DIAGNOSTICO_69_2026-09-08.md, secciones B.9 y B.10.
 *
 * Tres cohortes:
 *   A) MercadoPago conectado y CERO listings. Los 13 de B.9: hicieron el paso
 *      más difícil del sitio y no tienen ni un libro.
 *   B) Cero listings, sin MP, con rastro FUERTE de haber entrado a publicar:
 *      >=6 vistas de /publish o al menos una foto en el bucket covers. (B.10)
 *      El criterio original del P16-A (>=3 vistas, o >1h entre la primera y la
 *      ultima vista) daba 75 personas y no cabia en el tope diario; Vero lo
 *      subio el 08-09-2026 para quedarse con quienes insistieron de verdad.
 *   C) Vendedores con MP NO conectado, <=3 listings activos y al menos una
 *      ficha de $40.000 o mas. El caso tipo es Bárbara Saavedra (Algarrobo,
 *      Obras Completas de Neruda a $150.000): publicó caro y nadie le puede pagar.
 *
 * Idempotencia: tabla outreach_log (migración 20260908e_outreach_log.sql).
 * Índice único (user_id, cohort): si una corrida se corta por el tope de
 * Resend, la siguiente continúa sin repetirle a nadie.
 *
 * Cuota Resend: plan de 100/día y el digest de solicitudes ya consume hasta 87
 * a las 12:00 de Chile. Por eso el tope duro de 40 por corrida.
 *
 * VENTANA HORARIA: las corridas con --send se hacen SOLO entre las 13:00 y las
 * 20:59 de Chile. Antes de las 13:00 el digest de solicitudes todavía no
 * terminó de consumir su parte de la cuota, y a las 21:00 (00:00 UTC) Resend
 * la resetea: un envío a caballo entre los dos días parte con cuota prestada.
 * Fuera de esa franja el script avisa y pide confirmación explícita (--igual).
 *
 * Uso:
 *   node scripts/outreach_activacion.mjs                 # dry-run, las 3 cohortes
 *   node scripts/outreach_activacion.mjs --cohort=A
 *   node scripts/outreach_activacion.mjs --send --cohort=A --max=13
 *   node scripts/outreach_activacion.mjs --send --test    # solo a Vero, 1 por plantilla
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

for (const line of fs.readFileSync(".env.local", "utf-8").split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const SEND = args.includes("--send");
const TEST = args.includes("--test");
const COHORTE = (args.find((a) => a.startsWith("--cohort=")) || "").split("=")[1] || null;
const MAX = Number((args.find((a) => a.startsWith("--max=")) || "--max=40").split("=")[1]);

const SITE = "https://tuslibros.cl";
const LINK_PUBLISH = `${SITE}/publish`;
// /api/auth/mercadopago manda al login con next a este mismo flujo si no hay
// sesión, así el enlace del correo no pierde el clic (ver esa ruta, 08-09-2026).
const LINK_MP = `${SITE}/api/auth/mercadopago`;
const FROM = "Vero de tuslibros.cl <noreply@tuslibros.cl>";
const REPLY_TO = "veronicavelasquez@mac.com"; // vero@tuslibros.cl está suspendida
const TEST_TO = "veronicavelasquez@mac.com";

// Cuentas internas + el bot que escapó a la heurística de botDetection.ts (B.6).
const EXCLUIDOS = new Set([
  "vero@economics.cl",
  "veronicavelasquez@mac.com",
  "veronicavelasquez@tuslibros.com",
  "capir@tuslibros.cl",
  "mislibros@yopmail.com",
  "roger.floyd@atco.com",
]);

// ─────────────────────────────────────────────────────────── helpers

async function todas(tabla, cols, aplicar = (q) => q) {
  const out = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await aplicar(s.from(tabla).select(cols)).range(f, f + 999);
    if (error) throw new Error(`${tabla}: ${error.message}`);
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

// "Hola Jmt" es peor que "Hola". Si el full_name no parece un nombre (sin
// vocales, o de una o dos letras), el saludo va sin nombre.
const primerNombre = (full) => {
  const bruto = (full || "").trim().split(/\s+/)[0] || "";
  if (bruto.length < 3 || !/[aeiouáéíóú]/i.test(bruto)) return "";
  return bruto.replace(/^(.)(.*)$/, (_, a, b) => a.toUpperCase() + b);
};

// El saludo con coma solo si hay nombre: "Hola Ignacio," vs "Hola,".
const saludo = (nombre) => (nombre ? `Hola ${esc(nombre)}` : "Hola");

const pesos = (n) => "$" + Number(n).toLocaleString("es-CL");

const esc = (t) =>
  String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ─────────────────────────────────────────────────────────── plantillas
// Tono de Vero, primera persona. Sin cifras del sitio ni frases de marketing.

const marco = (parrafos) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a2e;max-width:560px">
  <h2 style="font-family:Georgia,serif;color:#1a3a6b;margin:0 0 4px">tuslibros.cl</h2>
  <div style="height:3px;width:54px;background:#d4a017;border-radius:2px;margin-bottom:18px"></div>
${parrafos.map((p) => `  <p>${p}</p>`).join("\n")}
  <p style="color:#837c70;font-size:12px;margin-top:26px">tuslibros.cl · marketplace de libros usados en Chile</p>
</div>`;

// En la version de texto un <a> se vuelve "texto: url", salvo cuando el texto
// del enlace YA es la url — ahi se imprimia dos veces.
const planoDesde = (parrafos) =>
  parrafos
    .map((p) =>
      p
        .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g, (_, href, txt) =>
          txt.trim() === href ? href : `${txt}: ${href}`
        )
        .replace(/<[^>]+>/g, "")
    )
    .join("\n\n");

function plantillaA(p) {
  const parrafos = [
    `${saludo(p.nombre)}, soy Vero, la que hace tuslibros.cl.`,
    `Vi que conectaste MercadoPago —que es la parte engorrosa— y no llegaste a publicar ningún libro.`,
    `Te escribo para preguntarte qué pasó: ¿el formulario, el mapa, la foto, otra cosa? Respóndeme a este correo con una línea, me sirve mucho para arreglarlo.`,
    `Y si quieres retomarlo: <a href="${LINK_PUBLISH}" style="color:#1a3a6b">${LINK_PUBLISH}</a>`,
    `Vero`,
  ];
  return {
    subject: "Conectaste el cobro y no alcanzaste a publicar",
    html: marco(parrafos),
    text: planoDesde(parrafos),
  };
}

function plantillaB(p) {
  const parrafos = [
    `${saludo(p.nombre)}, soy Vero, la que hace tuslibros.cl.`,
    `Vi que entraste a publicar un libro y algo no resultó. ¿Me cuentas qué fue? Puede ser el mapa, la búsqueda del libro, la foto, o simplemente que no era el momento.`,
    `Con una línea de respuesta me basta, lo estoy arreglando esta semana.`,
    `Si quieres intentarlo de nuevo: <a href="${LINK_PUBLISH}" style="color:#1a3a6b">${LINK_PUBLISH}</a>`,
    `Vero`,
  ];
  return {
    subject: "¿Qué pasó cuando intentaste publicar?",
    html: marco(parrafos),
    text: planoDesde(parrafos),
  };
}

function plantillaC(p) {
  // Sin promesas de despacho: no está confirmado que Shipit retire en todas
  // las comunas (caso Melipeuco).
  const cuantos =
    p.activos === 1
      ? "es el único libro que tienes publicado"
      : "es de los libros más caros que tienes publicados";
  const parrafos = [
    `${saludo(p.nombre)}, soy Vero de tuslibros.cl.`,
    `Tu "${esc(p.titulo)}" (${pesos(p.precio)}) ${cuantos}, y hoy nadie te lo puede pagar por el sitio porque no tienes activado el cobro.`,
    `Actívalo acá: <a href="${LINK_MP}" style="color:#1a3a6b">${LINK_MP}</a>`,
    `Son dos minutos, el pago te llega directo y la compra queda protegida para quien te compra.`,
    `Cualquier duda, responde este correo.`,
    `Vero`,
  ];
  return {
    subject: `Tu ${p.titulo} hoy no se puede comprar por el sitio`,
    html: marco(parrafos),
    text: planoDesde(parrafos),
  };
}

const PLANTILLAS = { A: plantillaA, B: plantillaB, C: plantillaC };

// ─────────────────────────────────────────────────────────── cohortes

async function construirCohortes() {
  const usuarios = await todas(
    "users",
    "id, email, full_name, city, created_at, mercadopago_user_id"
  );
  const listings = await todas("listings", "id, seller_id, status, price, book_id");

  const porVendedor = new Map();
  for (const l of listings) {
    if (!porVendedor.has(l.seller_id)) porVendedor.set(l.seller_id, []);
    porVendedor.get(l.seller_id).push(l);
  }

  const candidatos = usuarios.filter((u) => u.email && !EXCLUIDOS.has(u.email.toLowerCase()));
  const sinListing = candidatos.filter((u) => !porVendedor.has(u.id));

  // --- rastros de /publish (solo para los sin listing, que es a quienes aplica)
  const idsSinListing = sinListing.map((u) => u.id);
  const vistas = [];
  for (let i = 0; i < idsSinListing.length; i += 100) {
    const trozo = idsSinListing.slice(i, i + 100);
    vistas.push(
      ...(await todas("page_views", "user_id, created_at", (q) =>
        q.eq("path", "/publish").in("user_id", trozo)
      ))
    );
  }
  const rastro = new Map(); // user_id -> { vistas, minutos }
  for (const v of vistas) {
    const r = rastro.get(v.user_id) || { n: 0, min: Infinity, max: -Infinity };
    const t = new Date(v.created_at).getTime();
    r.n += 1;
    r.min = Math.min(r.min, t);
    r.max = Math.max(r.max, t);
    rastro.set(v.user_id, r);
  }

  // --- fotos en el bucket covers: cada carpeta de la raíz es un user_id
  const carpetas = [];
  for (let off = 0; ; off += 1000) {
    const { data, error } = await s.storage.from("covers").list("", { limit: 1000, offset: off });
    if (error) throw new Error(`storage covers: ${error.message}`);
    carpetas.push(...data.map((o) => o.name));
    if (data.length < 1000) break;
  }
  const conFoto = new Set(carpetas.filter((n) => /^[0-9a-f-]{36}$/.test(n)));

  // --- A: MercadoPago conectado y cero listings
  const A = sinListing
    .filter((u) => u.mercadopago_user_id)
    .map((u) => ({ ...u, motivo: "MP conectado, 0 libros publicados" }));
  const idsA = new Set(A.map((u) => u.id));

  // --- B: cero listings, sin MP, con rastro de haber intentado publicar
  const B = [];
  for (const u of sinListing) {
    if (idsA.has(u.id) || u.mercadopago_user_id) continue;
    const r = rastro.get(u.id);
    const nVistas = r?.n || 0;
    const minutos = r && r.max > r.min ? Math.round((r.max - r.min) / 60000) : 0;
    const foto = conFoto.has(u.id);
    // Criterio vigente: >=6 vistas O al menos una foto. Los minutos entre la
    // primera y la última vista se siguen mostrando como contexto, pero ya no
    // incluyen a nadie por sí solos.
    if (nVistas < 6 && !foto) continue;
    const razones = [];
    if (foto) razones.push("subió fotos al bucket");
    if (nVistas) razones.push(`${nVistas} vistas de /publish`);
    if (minutos > 60) razones.push(`${minutos} min entre 1ª y última vista`);
    B.push({ ...u, motivo: razones.join(" · "), vistas: nVistas, minutos });
  }

  // --- C: sin MP, <=3 activos, con al menos una ficha de $40.000+
  const libroIds = new Set();
  const preC = [];
  for (const u of candidatos) {
    if (u.mercadopago_user_id) continue;
    const suyos = porVendedor.get(u.id) || [];
    const activos = suyos.filter((l) => l.status === "active");
    if (!activos.length || activos.length > 3) continue;
    const caro = activos.filter((l) => Number(l.price) >= 40000).sort((a, b) => b.price - a.price)[0];
    if (!caro) continue;
    libroIds.add(caro.book_id);
    preC.push({ ...u, activos: activos.length, precio: Number(caro.price), book_id: caro.book_id });
  }
  const { data: libros } = await s.from("books").select("id, title").in("id", [...libroIds]);
  const titulo = new Map((libros || []).map((b) => [b.id, b.title]));
  const C = preC.map((u) => ({
    ...u,
    titulo: titulo.get(u.book_id) || "libro",
    motivo: `${u.activos} activo(s), el más caro ${pesos(u.precio)}`,
  }));

  return { A, B, C };
}

// ─────────────────────────────────────────────────────────── envío

async function yaEnviados() {
  const filas = await todas("outreach_log", "user_id, cohort");
  return new Set(filas.map((f) => `${f.user_id}|${f.cohort}`));
}

async function enviar(persona, cohorte, correo) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [persona.email],
      reply_to: REPLY_TO,
      subject: correo.subject,
      html: correo.html,
      text: correo.text,
    }),
  });
  const cuerpo = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: `${res.status} ${JSON.stringify(cuerpo)}` };
  await s.from("outreach_log").insert({
    user_id: persona.id,
    cohort: cohorte,
    template: `P16A-${cohorte}`,
    resend_id: cuerpo.id || null,
  });
  return { ok: true, id: cuerpo.id };
}

// ─────────────────────────────────────────────────────────── main

// Ventana de envío: 13:00–20:59 de Chile (ver cabecera). --igual la salta.
if (SEND && !args.includes("--igual")) {
  const hora = Number(
    new Intl.DateTimeFormat("es-CL", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );
  if (hora < 13 || hora > 20) {
    console.log(
      `Son las ${hora}:xx en Chile. Las corridas van entre 13:00 y 20:59: ` +
        `antes el digest no terminó de consumir la cuota y a las 21:00 Resend la resetea.\n` +
        `Si igual quieres mandar, agrega --igual.`
    );
    process.exit(1);
  }
}

const cohortes = await construirCohortes();
const enviados = await yaEnviados();
const letras = COHORTE ? [COHORTE.toUpperCase()] : ["A", "B", "C"];

if (TEST) {
  if (!SEND) {
    console.log("--test necesita --send. Aborto.");
    process.exit(1);
  }
  for (const L of letras) {
    const ejemplo = cohortes[L][0];
    if (!ejemplo) continue;
    const correo = PLANTILLAS[L]({ ...ejemplo, nombre: primerNombre(ejemplo.full_name) });
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TEST_TO],
        reply_to: REPLY_TO,
        subject: `[prueba ${L}] ${correo.subject}`,
        html: correo.html,
        text: correo.text,
      }),
    });
    console.log(`prueba ${L} → ${TEST_TO}: ${res.ok ? "✅" : "❌ " + (await res.text())}`);
    await new Promise((r) => setTimeout(r, 700));
  }
  process.exit(0);
}

let presupuesto = MAX;
const resumen = [];

for (const L of letras) {
  const lista = cohortes[L];
  const pendientes = lista.filter((u) => !enviados.has(`${u.id}|${L}`));
  const yaHechos = lista.length - pendientes.length;

  console.log(`\n${"─".repeat(78)}`);
  console.log(`COHORTE ${L} — ${lista.length} personas (${yaHechos} ya contactadas, ${pendientes.length} pendientes)`);
  console.log("─".repeat(78));
  console.log(
    ["#", "NOMBRE", "COMUNA", "EMAIL", "MOTIVO DE INCLUSIÓN"]
      .map((h, i) => h.padEnd([4, 26, 18, 34, 40][i]))
      .join("")
  );
  lista.forEach((u, i) => {
    const marca = enviados.has(`${u.id}|${L}`) ? "·" : String(i + 1);
    console.log(
      marca.padEnd(4) +
        (u.full_name || "(sin nombre)").slice(0, 25).padEnd(26) +
        (u.city || "—").slice(0, 17).padEnd(18) +
        u.email.slice(0, 33).padEnd(34) +
        u.motivo
    );
  });

  if (!SEND) {
    const ej = pendientes[0] || lista[0];
    if (ej) {
      const correo = PLANTILLAS[L]({ ...ej, nombre: primerNombre(ej.full_name) });
      console.log(`\n  ── ejemplo de correo (${ej.email}) ──`);
      console.log(`  Asunto: ${correo.subject}`);
      console.log(correo.text.split("\n").map((l) => "  " + l).join("\n"));
    }
    resumen.push(`${L}: ${lista.length} en total, ${pendientes.length} pendientes`);
    continue;
  }

  let ok = 0;
  let fail = 0;
  for (const u of pendientes) {
    if (presupuesto <= 0) {
      console.log(`  ⏸  tope de ${MAX} alcanzado; el resto queda para la próxima corrida`);
      break;
    }
    const correo = PLANTILLAS[L]({ ...u, nombre: primerNombre(u.full_name) });
    const r = await enviar(u, L, correo);
    presupuesto -= 1;
    if (r.ok) ok++;
    else fail++;
    console.log(`  ${r.ok ? "✅" : "❌"} ${u.email.padEnd(34)} ${r.ok ? r.id : r.error}`);
    await new Promise((x) => setTimeout(x, 700));
  }
  resumen.push(`${L}: ${ok} enviados, ${fail} fallidos, ${pendientes.length - ok - fail} sin mandar`);
}

console.log(`\n${"═".repeat(78)}`);
console.log(SEND ? "ENVÍO REAL" : "DRY-RUN — no se mandó ningún correo. Usa --send para enviar.");
resumen.forEach((r) => console.log("  " + r));
console.log(`  presupuesto restante de la corrida: ${SEND ? presupuesto : MAX}`);
