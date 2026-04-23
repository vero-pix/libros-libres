import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
if (!RESEND_KEY) throw new Error("Falta RESEND_API_KEY");

const FROM = "Vero de tuslibros.cl <noreply@tuslibros.cl>";
const REPLY_TO = "vero@tuslibros.cl";
const SUBJECT = "Hoy es el Día del Libro — ¿me ayudas a moverlo?";

const html = readFileSync(join(__dirname, "../docs/newsletter_22abril.html"), "utf8");

const s = createClient(SUPABASE_URL, SERVICE_KEY);

async function sendResend(to) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      reply_to: REPLY_TO,
      subject: SUBJECT,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend ${res.status}: ${err}`);
  }
  return res.json();
}

async function main() {
  console.log("→ Cargando destinatarios…");

  const emails = new Set();

  // 1. Todos los usuarios registrados
  const { data: users, error: uErr } = await s.from("users").select("email").not("email", "is", null);
  if (uErr) throw uErr;
  users.forEach((u) => u.email && emails.add(u.email.toLowerCase()));

  // 2. Suscriptores del newsletter (por si hay alguno sin cuenta)
  const { data: subs, error: sErr } = await s.from("newsletter_subscribers").select("email");
  if (sErr) throw sErr;
  subs.forEach((u) => u.email && emails.add(u.email.toLowerCase()));

  const list = [...emails];
  console.log(`→ ${list.length} destinatarios únicos (users + newsletter)`);
  console.log("→ Enviando con Resend…\n");

  let sent = 0;
  let failed = 0;
  for (const email of list) {
    try {
      await sendResend(email);
      sent++;
      console.log(`  ✓ ${email}`);
    } catch (err) {
      failed++;
      console.log(`  ✗ ${email} — ${err.message}`);
    }
    // Resend permite ~10 req/s; 150ms es conservador
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\n→ Total: ${sent} enviados, ${failed} fallidos, ${list.length} destinatarios.`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
