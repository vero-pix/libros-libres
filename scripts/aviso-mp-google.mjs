/**
 * Aviso a los vendedores SIN MercadoPago: sus libros no entran al feed de Google.
 *
 * El argumento no es la comisión (nunca les movió la aguja): es que el 25% del
 * catálogo queda invisible en Shopping, porque Google no acepta productos que no
 * se pueden pagar en línea. Ver [[reference_feed_excluye_sin_mp]].
 *
 *   node scripts/aviso-mp-google.mjs              → preview, no manda nada
 *   node scripts/aviso-mp-google.mjs --prueba     → manda solo a Vero
 *   node scripts/aviso-mp-google.mjs --apply      → manda a todos
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

async function todas(t, c) {
  const o = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await s.from(t).select(c).range(f, f + 999);
    o.push(...data);
    if (data.length < 1000) break;
  }
  return o;
}

function plural(n, sing, pl) {
  return n === 1 ? sing : pl;
}

function cuerpo(nombre, n) {
  const libros = `${n} ${plural(n, "libro", "libros")}`;
  const estan = plural(n, "está", "están");
  return `Hola ${nombre}:

Te escribo porque encontré algo revisando el sitio y me parece que tienes que saberlo.

Tienes ${libros} publicados en tuslibros.cl. Pero como todavía no tienes MercadoPago conectado, esos libros quedan fuera del catálogo que le entregamos a Google. Google no muestra productos que no se pueden pagar en línea, así que hoy tus ${plural(n, "libro no aparece", "libros no aparecen")} cuando alguien busca ese título por ahí.

O sea: tus libros ${estan} bien publicados, pero solo los ve quien entra directo a tuslibros.cl.

Conectar MercadoPago toma un par de minutos y se hace desde tu perfil:
https://tuslibros.cl/perfil

Apenas lo conectes, tus libros entran al catálogo de Google en la siguiente actualización, y además te pueden pagar en línea sin que tengas que coordinar nada.

Si prefieres seguir vendiendo por WhatsApp está bien también — pero quería que supieras lo que estabas dejando pasar, porque no hay forma de darse cuenta solo.

Cualquier duda me respondes este correo.

Vero
tuslibros.cl`;
}

const users = await todas("users", "id,full_name,email,mercadopago_user_id");
const ls = (await todas("listings", "seller_id,status")).filter((l) => l.status === "active");
const cnt = {};
for (const l of ls) cnt[l.seller_id] = (cnt[l.seller_id] || 0) + 1;

let objetivo = users
  .filter((u) => !u.mercadopago_user_id && cnt[u.id] > 0 && u.email)
  .sort((a, b) => cnt[b.id] - cnt[a.id]);

if (PRUEBA) {
  const muestra = objetivo[0];
  objetivo = [{ ...muestra, email: "vero@tuslibros.cl", full_name: muestra.full_name }];
}

console.log(`Destinatarios: ${objetivo.length}`);
if (!APPLY && !PRUEBA) {
  const m = objetivo[0];
  console.log(`\n─── ejemplo (${m.full_name}, ${cnt[m.id]} libros) ───\n`);
  console.log(cuerpo((m.full_name ?? "").split(" ")[0] || "hola", cnt[m.id]));
  console.log(`\n─── PREVIEW: no se mandó nada. --prueba para probar, --apply para enviar. ───`);
  process.exit(0);
}

const KEY = process.env.RESEND_API_KEY;
if (!KEY) {
  console.error("Falta RESEND_API_KEY");
  process.exit(1);
}

let ok = 0,
  fail = 0;
for (const u of objetivo) {
  const n = cnt[u.id];
  const nombre = (u.full_name ?? "").split(" ")[0] || "hola";
  const texto = cuerpo(nombre, n);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Vero de tuslibros.cl <vero@tuslibros.cl>",
      to: [u.email],
      reply_to: "vero@tuslibros.cl",
      subject: `Tus ${n} ${plural(n, "libro no está apareciendo", "libros no están apareciendo")} en Google`,
      text: texto,
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
