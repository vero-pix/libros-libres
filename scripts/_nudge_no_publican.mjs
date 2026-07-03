import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const l of env.split("\n")) { if (l.startsWith("#") || !l.includes("=")) continue; const i = l.indexOf("="); const k = l.slice(0, i).trim(); if (!process.env[k]) process.env[k] = l.slice(i + 1).trim(); }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RESEND = process.env.RESEND_API_KEY;
const DRY = !process.argv.includes("--send");

// Ya recibieron nudge el 24 jun — no repetir
const YA_NUDGED = new Set([
  "parach2@gmail.com","ojopiojo@gmail.com","ariffo@gmail.com","javieraespejojeraldo@gmail.com",
  "pablorivera19899812@gmail.com","fermae96@gmail.com","valenzuela.victor@gmail.com","flor.rego8@protonmail.com",
]);

const now = Date.now();
const H = (ms) => (now - new Date(ms).getTime()) / 3600000;

// Registrados últimos 14 días
const { data: users } = await s.from("users")
  .select("id, full_name, email, username, created_at, mercadopago_access_token")
  .gte("created_at", new Date(now - 14 * 86400000).toISOString())
  .order("created_at", { ascending: false });

const targets = [];
for (const u of users ?? []) {
  if (!u.email) continue;
  if (YA_NUDGED.has(u.email.toLowerCase())) continue;
  const h = H(u.created_at);
  if (h < 36) continue; // recién registrado: ya recibió bienvenida auto, darle tiempo
  const { count } = await s.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", u.id);
  if ((count ?? 0) > 0) continue; // ya publicó
  targets.push({ ...u, hasMP: !!u.mercadopago_access_token, days: (h / 24).toFixed(0) });
}

const wrap = (body) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a2e;max-width:560px">
  <h2 style="font-family:Georgia,serif;color:#1a3a6b;margin:0 0 4px">tuslibros.cl</h2>
  <div style="height:3px;width:54px;background:#d4a017;border-radius:2px;margin-bottom:18px"></div>
  ${body}
  <p style="color:#837c70;font-size:12px;margin-top:26px">tuslibros.cl · marketplace de libros usados en Chile</p>
</div>`;
const btn = (href, txt) => `<div style="margin:22px 0"><a href="${href}" style="background:#d4a017;color:#fff;font-weight:bold;padding:12px 26px;border-radius:8px;text-decoration:none;font-size:14px">${txt}</a></div>`;

const html = (nombre, hasMP) => wrap(`
  <p>Hola${nombre ? ` ${nombre}` : ""}:</p>
  <p>Soy Vero, la que está detrás de tuslibros.cl. Vi que te registraste hace unos días y quise escribirte yo misma — gracias por sumarte 📚</p>
  <p>Te falta el paso más entretenido: <strong>subir tu primer libro</strong>. Y justo esta semana lo dejé más simple — antes te pedía completar todo el perfil primero, ahora entras directo: escaneas el código de barras o le sacas una foto a la portada, y nosotros completamos portada, sinopsis y categoría. Tú solo le pones precio.</p>
  ${hasMP ? "<p>Además vi algo bueno: <strong>ya conectaste MercadoPago</strong>, así que estás listo/a para cobrar apenas alguien compre. Solo te falta publicar.</p>" : ""}
  ${btn("https://tuslibros.cl/publish", "Publicar mi primer libro →")}
  <p>Si tienes varios y te da lata subirlos de a uno, respóndeme este mismo correo con una foto de la pila o un Excel y te los cargo yo. Un abrazo 📚</p>
  <p>— Vero</p>`);

console.log(`\n${DRY ? "🔎 DRY-RUN (no envía)" : "📤 ENVIANDO"} — ${targets.length} destinatarios:\n`);
for (const t of targets) {
  console.log(`  ${t.days}d  ${(t.full_name ?? "?").padEnd(28)} ${t.email.padEnd(38)} ${t.hasMP ? "MP✅" : ""}`);
  if (!DRY) {
    const nombre = (t.full_name ?? "").split(" ")[0] || "";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Vero de tuslibros.cl <noreply@tuslibros.cl>",
        to: [t.email], reply_to: "vero@economics.cl",
        subject: "Te falta subir tu primer libro en tuslibros.cl 📚",
        html: html(nombre, t.hasMP),
      }),
    });
    console.log(`     ${res.ok ? "✅ enviado" : "❌ " + res.status + " " + (await res.text())}`);
  }
}
console.log(`\n${DRY ? "Para enviar: node scripts/_nudge_no_publican.mjs --send" : "Listo."}`);
