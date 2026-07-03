import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));

// env
const env = readFileSync(join(__dirname, "../.env.local"), "utf-8");
for (const l of env.split("\n")) { if (l.startsWith("#") || !l.includes("=")) continue; const i = l.indexOf("="); const k = l.slice(0, i).trim(); if (!process.env[k]) process.env[k] = l.slice(i + 1).trim(); }

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RESEND = process.env.RESEND_API_KEY;
const DRY = !process.argv.includes("--send");

const FROM = "Vero de tuslibros.cl <noreply@tuslibros.cl>";
const REPLY_TO = "vero@economics.cl";
const SUBJECT = "Hice más fácil subir tus libros a tuslibros.cl 📚";
const HTML = readFileSync(join(__dirname, "../docs/newsletter_1jul2026.html"), "utf8");

// Los que recibieron el nudge HOY — no les mandamos el newsletter el mismo día
const NUDGED_HOY = new Set([
  "marianela_caniglia@hotmail.com","joserhs@gmail.com","maricelfg.98@gmail.com","subilla63@gmail.com",
  "grover5sam@gmail.com","gese1991@gmail.com","ignacio.pereira.diaz@gmail.com","fernando.reyes.cj@gmail.com",
  "faundezlepe.rf@gmail.com","raniman@gmail.com","tomatebailarin98@gmail.com","venerosmellaantonella@gmail.com",
  "andja.anczak@gmail.com","gonbalboa.lopez@gmail.com","castrov@ticlibre.com","lsalazar202005@gmail.com",
]);

// ── Filtro anti-basura: la tabla de suscriptores tiene ~116 bots (dominios extranjeros
// al azar, SMS-gateways, role). Enviarles quema la reputación de remitente. Solo gente real.
const CONSUMER = /@(gmail|hotmail|outlook|live|yahoo|icloud|me|mac|proton|protonmail|gmx|fastmail)\.(com|es|cl|net|me)$/i;
const CL = /\.cl$/i;
const SMS = /@(txt\.att\.net|tmomail\.net|vtext\.com|messaging\.sprintpcs\.com|mypixmessages\.com)$/i;
const DISPOSABLE = /@(yopmail|mailinator|guerrillamail|tempmail|trashmail|sharklasers|getnada)\./i;
const ROLE = /^(noreply|no-reply|admin|postmaster|webmaster|info|support|abuse|root)@/i;
const VERO = /(veronicavelasquez|vero@|spa@tuslibros|@tuslibros\.(cl|com)|@economics\.cl)/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isReal = (e) => {
  if (!EMAIL_RE.test(e) || SMS.test(e) || DISPOSABLE.test(e) || ROLE.test(e) || VERO.test(e)) return false;
  const dom = "@" + (e.split("@")[1] || "");
  if (CONSUMER.test(e) || CL.test(e) || /\.(uchile|uc|usach|udec|duoc|puc)\.cl$/i.test(dom)) return true;
  return false; // dominio no-consumidor extranjero → probable bot
};

const emails = new Set();
const { data: users } = await s.from("users").select("email").not("email", "is", null);
users?.forEach((u) => u.email && emails.add(u.email.toLowerCase()));
const { data: subs } = await s.from("newsletter_subscribers").select("email").not("email", "is", null);
subs?.forEach((u) => u.email && emails.add(u.email.toLowerCase()));

const base = emails.size;
const clean = [...emails].filter(isReal);
const junkCount = base - clean.length;
let list = clean.filter((e) => !NUDGED_HOY.has(e));

console.log(`\n${DRY ? "🔎 DRY-RUN" : "📤 ENVIANDO"} — ${list.length} destinatarios`);
console.log(`   (base ${base} · basura filtrada ${junkCount} · nudgeados hoy ${clean.length - list.length})\n`);

if (DRY) {
  console.log("Muestra (primeros 12):");
  list.slice(0, 12).forEach((e) => console.log("  " + e));
  console.log(`\nSubject: ${SUBJECT}`);
  console.log(`From: ${FROM}  ·  Reply-To: ${REPLY_TO}`);
  console.log("\nPara enviar: node scripts/send_newsletter_1jul.mjs --send");
} else {
  let ok = 0, fail = 0;
  for (const to of list) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject: SUBJECT, html: HTML }),
      });
      if (res.ok) { ok++; } else { fail++; console.log(`  ❌ ${to}: ${res.status} ${await res.text()}`); }
    } catch (e) { fail++; console.log(`  ❌ ${to}: ${e.message}`); }
    await new Promise((r) => setTimeout(r, 120)); // ~8/s, bajo el rate limit de Resend
  }
  console.log(`\nListo: ${ok} enviados, ${fail} fallidos.`);
}
