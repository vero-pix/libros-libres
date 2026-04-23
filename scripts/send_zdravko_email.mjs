import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

// Cargar env de producción (RESEND_API_KEY está ahí)
const envFiles = [".env.production.tmp", ".env.local"];
for (const f of envFiles) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) continue;
  const content = fs.readFileSync(p, "utf-8");
  for (const line of content.split("\n")) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("❌ No RESEND_API_KEY. Corre primero: vercel env pull .env.production.tmp --environment=production");
  process.exit(1);
}

const html = fs.readFileSync(path.join(root, "docs/email_testimonio_zdravko.html"), "utf-8");

// Modo: dryrun (mandar a Vero para preview) | send (mandar a Zdravko)
const mode = process.argv[2] ?? "dryrun";

const payloads = {
  dryrun: {
    to: "veronicavelasquez@mac.com",
    subject: "[PREVIEW] ¿Me cuentas cómo te fue con el libro? 📚",
  },
  send: {
    to: "zdravko.miroslav@gmail.com",
    subject: "¿Me cuentas cómo te fue con el libro? 📚",
  },
};

if (!payloads[mode]) {
  console.error(`Modo inválido: ${mode}. Usa "dryrun" o "send".`);
  process.exit(1);
}

const { to, subject } = payloads[mode];

console.log(`Modo: ${mode.toUpperCase()}`);
console.log(`Para: ${to}`);
console.log(`Asunto: ${subject}`);
console.log(`Desde: Vero — tuslibros.cl <noreply@tuslibros.cl>`);
console.log(`Reply-to: vero@economics.cl`);
console.log("");

const body = {
  from: "Vero — tuslibros.cl <noreply@tuslibros.cl>",
  to,
  subject,
  html,
  reply_to: "vero@economics.cl",
};

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const txt = await res.text();
if (!res.ok) {
  console.error(`❌ Error ${res.status}:`, txt);
  process.exit(1);
}

console.log("✓ Enviado");
console.log(txt);
