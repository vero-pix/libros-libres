import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("❌ No RESEND_API_KEY. Corre: vercel env pull .env.production.tmp --environment=production");
  process.exit(1);
}

const vendors = [
  { name: "Patricio", email: "pbustosbarros@gmail.com", username: "patricio.bustos.b" },
  { name: "Aysel", email: "ayselabdalagon@gmail.com", username: "aysel.abdala" },
  { name: "Rodrigo", email: "rodrigoolivero73@gmail.com", username: "rodrigo.olivero" },
  { name: "Bryan", email: "orvenesb@gmail.com", username: "bryan.orvenes" },
  { name: "Estefanía", email: "evnavarrete@uc.cl", username: "estefania.de.olivera" },
];

function buildHtml(name, username) {
  const profileUrl = `https://tuslibros.cl/vendedor/${username}`;
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f9f6f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f0;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e0d0;">
        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:28px 36px;">
            <p style="margin:0;color:#f0e6d0;font-size:22px;font-weight:bold;letter-spacing:0.5px;">📚 tuslibros.cl</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 28px;">
            <p style="margin:0 0 16px;font-size:17px;color:#2d2d2d;">Hola ${name},</p>
            <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;">
              Tu tienda en tuslibros.cl ya tiene una URL propia con tu nombre. Ahora puedes compartirla directamente:
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td style="background:#f0e6d0;border-radius:8px;padding:14px 20px;border:1px solid #d4c4a0;">
                  <a href="${profileUrl}" style="color:#1a1a2e;font-size:15px;font-weight:bold;text-decoration:none;">
                    🔗 ${profileUrl}
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;">
              Mándala por WhatsApp, ponla en tu Instagram o compártela donde quieras. Quien la abra ve todos tus libros disponibles al tiro.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#e85d26;border-radius:8px;padding:0;">
                  <a href="${profileUrl}" style="display:block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">
                    Ver mi tienda →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #f0e6d0;">
            <p style="margin:0;font-size:12px;color:#888;line-height:1.6;">
              Cualquier duda escríbeme a <a href="mailto:vero@tuslibros.cl" style="color:#e85d26;">vero@tuslibros.cl</a> o por WhatsApp.<br>
              — Vero, tuslibros.cl
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const mode = process.argv[2] ?? "dryrun";

async function sendEmail(to, name, username) {
  const html = buildHtml(name, username);
  const body = {
    from: "Vero — tuslibros.cl <noreply@tuslibros.cl>",
    to,
    cc: "vero@economics.cl",
    subject: `${name}, ya tienes tu tienda con URL propia en tuslibros.cl`,
    html,
    reply_to: "vero@tuslibros.cl",
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
    console.error(`  ❌ Error ${res.status}: ${txt}`);
    return false;
  }
  return true;
}

if (mode === "dryrun") {
  console.log("MODO: DRYRUN — enviando preview a veronicavelasquez@mac.com\n");
  const { name, username } = vendors[0];
  const ok = await sendEmail("veronicavelasquez@mac.com", name, username);
  if (ok) console.log(`✓ Preview enviado (como si fuera email de ${name} / ${username})`);
} else if (mode === "send") {
  console.log("MODO: ENVÍO REAL\n");
  for (const { name, email, username } of vendors) {
    process.stdout.write(`  ${name} <${email}> ... `);
    const ok = await sendEmail(email, name, username);
    console.log(ok ? "✓" : "✗");
    await new Promise(r => setTimeout(r, 300));
  }
  console.log("\nListo.");
} else {
  console.error(`Modo inválido: ${mode}. Usa "dryrun" o "send".`);
  process.exit(1);
}
