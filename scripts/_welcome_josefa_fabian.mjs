import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("="); const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RESEND = process.env.RESEND_API_KEY;

// ── 1) Categorizar libros de Fabián (NULL → slug top-level, según convención de la BD) ──
const FABIAN_CATS = {
  "Los Secretos de Fra Fra": "infantil-juvenil",
  "El príncipe y el mendigo": "ficcion",
  "Donde Vuelan los Cóndores: Una Pesadilla y una Esperanza": "ficcion",
  "Pesadilla en Vancouver": "infantil-juvenil",
  "La Casa de Bernarda Alba / Doña Rosita la Soltera": "ficcion",
  "José Miguel Carrera: Revolucionario impetuoso": "no-ficcion",
  "Pedro de Valdivia: Fundador del Nuevo Extremo": "no-ficcion",
  "¿Por qué se perdió... La Guerra con Chile?": "no-ficcion",
  "Delirio de mi sangre": "ficcion",
  "La fortuna del gran Jacques Coeur": "ficcion",
  "El futuro de la humanidad": "no-ficcion",
  "Pan para el viaje: Migajas de sabiduría y fe para cada día": "no-ficcion",
  "Un Grito Desesperado": "no-ficcion",
  "La Tumba de Colón": "ficcion",
  "El ABC para salir de deudas: Convierte las deudas malas en deudas buenas y fortalece tu crédito": "no-ficcion",
  "El Mercader de Venecia": "ficcion",
  "Cien años de soledad": "ficcion",
  "El Extranjero": "ficcion",
  "Un Mundo Feliz": "ficcion",
};
const { data: fab } = await s.from("users").select("id").eq("username", "fabian.ignacio.sagredo.saez").maybeSingle();
const { data: fls } = await s.from("listings").select("book_id, book:books(title, category)").eq("seller_id", fab.id);
let catCount = 0;
for (const l of fls) {
  if (l.book?.category) continue;
  const cat = FABIAN_CATS[l.book?.title];
  if (!cat) { console.log(`  ⚠️ sin mapeo: "${l.book?.title}"`); continue; }
  const { error } = await s.from("books").update({ category: cat }).eq("id", l.book_id);
  if (error) console.log(`  ❌ ${l.book?.title}: ${error.message}`); else catCount++;
}
console.log(`Fabián: ${catCount} libros categorizados`);

// ── 2) Destacar a Josefa (Fabián ya está featured) ──
for (const un of ["josefa.cerda", "fabian.ignacio.sagredo.saez"]) {
  const { error } = await s.from("users").update({ featured: true }).eq("username", un);
  console.log(`featured @${un}: ${error ? "❌ " + error.message : "✅"}`);
}

// ── 3) Emails de bienvenida + nudge MercadoPago ──
const wrap = (body) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a2e;max-width:560px">
  <h2 style="font-family:Georgia,serif;color:#1a3a6b;margin:0 0 4px">tuslibros.cl</h2>
  <div style="height:3px;width:54px;background:#d4a017;border-radius:2px;margin-bottom:18px"></div>
  ${body}
  <p style="color:#837c70;font-size:12px;margin-top:26px">tuslibros.cl · marketplace de libros usados en Chile</p>
</div>`;

const mpBlock = `
  <div style="background:#fff8e8;border:1px solid #f0d98a;border-radius:10px;padding:14px 16px;margin:18px 0">
    <p style="margin:0 0 8px"><strong>Falta un pasito para vender: conectar MercadoPago.</strong></p>
    <p style="margin:0 0 12px">Mientras no lo conectes, los compradores no pueden pagarte directo. Se conecta en 1 minuto desde tu perfil — tú recibes la plata al toque (split payment) y yo me encargo del resto.</p>
    <a href="https://tuslibros.cl/perfil" style="display:inline-block;background:#1a3a6b;color:#fff;text-decoration:none;padding:9px 18px;border-radius:8px;font-weight:600">Conectar MercadoPago</a>
  </div>`;

const emails = [
  {
    to: "fabignasagredo89@gmail.com",
    subject: "¡Bienvenido a tuslibros.cl, Fabián! 📚",
    html: wrap(`
      <p>Hola Fabián:</p>
      <p>Soy Vero, la que está detrás de tuslibros.cl. Vi que subiste 21 libros con tus propias fotos y quería escribirte yo misma para darte las gracias por sumarte.</p>
      <p>Tienes una selección muy buena: harta historia de Chile (Carrera, Pedro de Valdivia, la Guerra del Pacífico) mezclada con clásicos como Cien años de soledad, Camus y Huxley. Esa combinación se busca harto acá.</p>
      <p>Te dejé como <strong>vendedor destacado</strong> en la portada y te ordené todos los libros por categoría, así que ya están visibles y aparecen arriba estos días.</p>
      ${mpBlock}
      <p>Un tip extra: completa tu <strong>comuna</strong> en el perfil, porque los compradores filtran por cercanía.</p>
      <p>Cualquier duda me respondes este correo directo. Bienvenido 📚</p>
      <p>— Vero</p>`),
  },
  {
    to: "josefitacl19@gmail.com",
    subject: "¡Bienvenida a tuslibros.cl, Josefa! 📚",
    html: wrap(`
      <p>Hola Josefa:</p>
      <p>Soy Vero, la que está detrás de tuslibros.cl. Vi que subiste tus 10 libros con fotos propias y quería darte la bienvenida yo misma.</p>
      <p>Me encantó tu línea: harto juvenil y romance que se vende rápido — Crepúsculo, la Casa de la Noche, Benavent, Tom Clancy. Ese público es súper activo acá.</p>
      <p>Te dejé como <strong>vendedora destacada</strong> en la portada para darle un empujón a tus libros estos días. Tus fichas quedaron completas y categorizadas.</p>
      ${mpBlock}
      <p>Dos tips para vender más rápido: completa tu <strong>ciudad y comuna</strong> en el perfil (los compradores filtran por cercanía y todavía las tienes vacías).</p>
      <p>Cualquier duda me respondes este correo directo. Bienvenida 📚</p>
      <p>— Vero</p>`),
  },
];

for (const e of emails) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Vero de tuslibros.cl <noreply@tuslibros.cl>",
      to: [e.to],
      reply_to: "vero@economics.cl",
      subject: e.subject,
      html: e.html,
    }),
  });
  console.log(`email → ${e.to}: ${res.ok ? "✅ enviado" : "❌ " + res.status + " " + (await res.text())}`);
}

// ── 4) Verificación ──
const { data: chk } = await s.from("users").select("username, featured").in("username", ["josefa.cerda", "fabian.ignacio.sagredo.saez"]);
const { data: fls2 } = await s.from("listings").select("book:books(category)").eq("seller_id", fab.id);
const c = {}; for (const l of fls2) c[l.book?.category ?? "NULL"] = (c[l.book?.category ?? "NULL"] ?? 0) + 1;
console.log("\nfeatured:", chk);
console.log("categorías Fabián:", c);
