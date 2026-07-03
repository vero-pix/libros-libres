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

const { data: u } = await s.from("users").select("id").eq("username", "sol.pg").maybeSingle();

// Categorizar: 2 NULL + 2 mal puestas en "otros"
const CATS = {
  "Fundamentación teórica de la bioneuroemoción": "no-ficcion",
  "El Poder De Cambiar/ The Power Of Change (Spanish Edition)": "no-ficcion",
  "Mujeres que corren con los lobos - 1. ed.": "no-ficcion",
  "La maestra de Sócrates": "ficcion",
};
const { data: ls } = await s.from("listings").select("book_id, book:books(title, category)").eq("seller_id", u.id);
let n = 0;
for (const l of ls) {
  const cat = CATS[l.book?.title];
  if (!cat || l.book?.category === cat) continue;
  const { error } = await s.from("books").update({ category: cat }).eq("id", l.book_id);
  if (error) console.log(`  ❌ ${l.book?.title}: ${error.message}`); else n++;
}
console.log(`Sol PG: ${n} libros (re)categorizados`);

const { error: fe } = await s.from("users").update({ featured: true }).eq("username", "sol.pg");
console.log(`featured @sol.pg: ${fe ? "❌ " + fe.message : "✅"}`);

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

const html = wrap(`
  <p>Hola Sol:</p>
  <p>Soy Vero, la que está detrás de tuslibros.cl. Vi que subiste tus 7 libros con fotos propias desde Temuco y quería darte la bienvenida yo misma.</p>
  <p>Me gustó tu selección de crecimiento personal y psicología: <em>Mujeres que corren con los lobos</em>, Enric Corbera, Clarissa Pinkola. Ese mundo tiene lectoras muy fieles y se busca harto acá.</p>
  <p>Te dejé como <strong>vendedora destacada</strong> en la portada estos días y te ordené los libros por categoría para que se encuentren mejor.</p>
  ${mpBlock}
  <p>Un tip extra: ser de Temuco es una ventaja, porque hay pocos vendedores en regiones y los compradores del sur filtran por cercanía. Asegúrate de tener tu comuna en el perfil.</p>
  <p>Cualquier duda me respondes este correo directo. Bienvenida 📚</p>
  <p>— Vero</p>`);

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: "Vero de tuslibros.cl <noreply@tuslibros.cl>",
    to: ["solepg@gmail.com"],
    reply_to: "vero@economics.cl",
    subject: "¡Bienvenida a tuslibros.cl, Sol! 📚",
    html,
  }),
});
console.log(`email → solepg@gmail.com: ${res.ok ? "✅ enviado" : "❌ " + res.status + " " + (await res.text())}`);
