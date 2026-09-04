/**
 * Aviso a los vendedores SIN MercadoPago: sus libros YA se pueden pedir.
 *
 * Hasta el 30-08-2026 la ficha de un vendedor sin MP no mostraba ninguna acción
 * de compra —el botón de carrito vivía dentro de la rama "el vendedor tiene
 * MP"—, así que 530 libros solo ofrecían WhatsApp. Arreglado y desplegado ese
 * día. Este correo se lo cuenta a los afectados.
 *
 * A diferencia de aviso-mp-google.mjs, acá NO se les pide nada: es una
 * disculpa y una buena noticia. Es el tercer correo en diez días para varios de
 * ellos (20 ago: MP a los grandes · 28 ago: feed de Google), así que el
 * argumento de MercadoPago va al final y en una línea, no como el pedido.
 *
 *   node scripts/aviso-carrito-sin-mp.mjs           → preview, no manda nada
 *   node scripts/aviso-carrito-sin-mp.mjs --prueba  → manda solo a Vero
 *   node scripts/aviso-carrito-sin-mp.mjs --apply   → manda a todos
 *
 * Por defecto apunta a los vendedores con 10+ libros activos sin MP (los 6 del
 * 30-08-2026). --todos levanta el corte.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
for (const l of env.split("\n")) {
  if (l.startsWith("#") || !l.includes("=")) continue;
  const i = l.indexOf("=");
  const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes("--apply");
const PRUEBA = process.argv.includes("--prueba");
const TODOS = process.argv.includes("--todos");
const MINIMO = TODOS ? 1 : 10;

async function todas(t, c) {
  const o = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await s.from(t).select(c).range(f, f + 999);
    o.push(...data);
    if (data.length < 1000) break;
  }
  return o;
}

const plural = (n, sing, pl) => (n === 1 ? sing : pl);

function cuerpo(nombre, n) {
  const libros = `${n} ${plural(n, "libro", "libros")}`;
  return `Hola ${nombre}:

Te escribo para contarte algo que arreglé hoy, y de paso para pedirte disculpas.

Tienes ${libros} publicados en tuslibros.cl. Hasta ayer, quien llegaba a ${plural(n, "esa ficha", "esas fichas")} no tenía ningún botón para pedirte el libro: le aparecía tu WhatsApp y nada más. Sin querer había dejado el botón de "agregar al carrito" dentro de la parte del sitio que solo funciona si el vendedor tiene MercadoPago conectado. Como tú no lo tienes, tus libros se veían pero no se podían pedir.

Eran ${plural(n, "un libro", "530 libros")} en total entre todos los vendedores en la misma situación, y ${plural(n, "el tuyo estaba", "los tuyos estaban")} entre ellos.

Ya está arreglado. Desde hoy tus libros tienen su botón, el comprador te los puede pedir por el sitio y ustedes coordinan la entrega y el pago directamente entre ustedes, como siempre. No tienes que hacer nada ni cambiar nada.

Si en algún momento quieres además cobrar en línea, MercadoPago se conecta desde tu perfil (https://tuslibros.cl/perfil) y con eso tus libros entran también al catálogo de Google. Pero eso es aparte: hoy tus libros ya se pueden pedir sin nada de eso.

Perdón por las semanas que estuvieron ahí sin que nadie pudiera comprarlos.

Cualquier cosa me respondes este correo.

Vero
tuslibros.cl`;
}

const users = await todas("users", "id,full_name,username,email,mercadopago_user_id");
const ls = (await todas("listings", "seller_id,status")).filter((l) => l.status === "active");
const cnt = {};
for (const l of ls) cnt[l.seller_id] = (cnt[l.seller_id] || 0) + 1;

let objetivo = users
  .filter((u) => !u.mercadopago_user_id && (cnt[u.id] ?? 0) >= MINIMO && u.email)
  .sort((a, b) => cnt[b.id] - cnt[a.id]);

if (PRUEBA) {
  // Al correo personal, no a vero@tuslibros.cl: un envío del mismo dominio al
  // mismo dominio se pierde en silencio (ver [[feedback_email_same_domain_loop]]).
  const m = objetivo[0];
  objetivo = [{ ...m, email: "veronicavelasquez@mac.com" }];
}

console.log(`Destinatarios (${MINIMO}+ libros activos, sin MP): ${objetivo.length}`);
for (const u of objetivo) console.log(`  ${String(cnt[u.id]).padStart(4)} libros · @${u.username ?? "—"}`);

if (!APPLY && !PRUEBA) {
  const m = objetivo[0];
  console.log(`\n─── asunto ───\nTus ${cnt[m.id]} libros ya se pueden pedir (perdón por la demora)`);
  console.log(`\n─── cuerpo (ejemplo: ${(m.full_name ?? "").split(" ")[0]}, ${cnt[m.id]} libros) ───\n`);
  console.log(cuerpo((m.full_name ?? "").split(" ")[0] || "hola", cnt[m.id]));
  console.log(`\n─── PREVIEW: no se mandó nada. --prueba manda solo a Vero, --apply envía. ───`);
  process.exit(0);
}

const KEY = process.env.RESEND_API_KEY;
if (!KEY) {
  console.error("Falta RESEND_API_KEY");
  process.exit(1);
}

let ok = 0;
let fail = 0;
for (const u of objetivo) {
  const n = cnt[u.id];
  const nombre = (u.full_name ?? "").split(" ")[0] || "hola";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Vero de tuslibros.cl <vero@tuslibros.cl>",
      to: [u.email],
      reply_to: "vero@tuslibros.cl",
      subject: `Tus ${n} ${plural(n, "libro ya se puede pedir", "libros ya se pueden pedir")} (perdón por la demora)`,
      text: cuerpo(nombre, n),
    }),
  });
  if (res.ok) {
    ok++;
    console.log(`  ✓ ${u.email} (${n} libros)`);
  } else {
    fail++;
    console.log(`  ✗ ${u.email} — ${(await res.text()).slice(0, 120)}`);
  }
  // La cuota gratis de Resend es 100/día y limita por segundo: no atropellar.
  await new Promise((r) => setTimeout(r, 600));
}
console.log(`\nEnviados: ${ok} · fallidos: ${fail}`);
