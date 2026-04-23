import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RESEND_KEY = process.env.RESEND_API_KEY;
if (!RESEND_KEY) throw new Error("Falta RESEND_API_KEY");

const FROM = "Vero de tuslibros.cl <noreply@tuslibros.cl>";
const REPLY_TO = "vero@tuslibros.cl";
const SUBJECT = "Hoy es el Día del Libro — ¿me ayudas a moverlo?";

const html = readFileSync(join(__dirname, "../docs/newsletter_22abril_conocidos.html"), "utf8");

// Lee lista desde docs/lista_conocidos.txt
// Un email por línea. Líneas vacías y las que empiezan con # se ignoran.
const listPath = join(__dirname, "../docs/lista_conocidos.txt");
const raw = readFileSync(listPath, "utf8");
const emails = raw
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => line.toLowerCase())
  .filter((line) => line.includes("@"));

// Dedupe
const unique = [...new Set(emails)];

console.log(`→ Lista cargada: ${unique.length} emails únicos`);

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
  console.log("→ Enviando con Resend…\n");

  let sent = 0;
  let failed = 0;
  const failures = [];

  for (const email of unique) {
    try {
      await sendResend(email);
      sent++;
      console.log(`  ✓ ${email}`);
    } catch (err) {
      failed++;
      failures.push({ email, error: err.message });
      console.log(`  ✗ ${email} — ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\n→ Total: ${sent} enviados, ${failed} fallidos, ${unique.length} únicos.`);
  if (failures.length) {
    console.log("\nFallidos:");
    failures.forEach((f) => console.log(`  ${f.email} — ${f.error}`));
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
