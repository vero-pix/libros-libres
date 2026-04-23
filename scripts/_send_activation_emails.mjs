import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const EXCLUDED_EMAILS = [
  "vero@tuslibros.cl",
  "vero@economics.cl",
  "veronicavelasquez@mac.com",
  "veronicavelasquez@tuslibros.com",
];

const DRY_RUN = process.argv.includes("--dry-run");

// 1. Encontrar usuarios dormidos: confirmaron email, ≥3d desde registro, sin actividad
const now = Date.now();
const threeDaysAgo = new Date(now - 3 * 24 * 3600e3).toISOString();

const { data: users } = await s
  .from("users")
  .select("id, email, full_name, created_at")
  .lt("created_at", threeDaysAgo);

const dormant = [];
for (const u of users ?? []) {
  if (EXCLUDED_EMAILS.includes(u.email)) continue;

  // Checar email confirmado
  const { data: authData } = await s.auth.admin.listUsers({ perPage: 500 });
  const au = authData?.users?.find((x) => x.email === u.email);
  if (!au?.email_confirmed_at) continue;

  const [{ count: listingsN }, { count: ordersN }, { count: cartN }] = await Promise.all([
    s.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", u.id),
    s.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", u.id),
    s.from("cart_items").select("id", { count: "exact", head: true }).eq("user_id", u.id),
  ]);

  if ((listingsN ?? 0) === 0 && (ordersN ?? 0) === 0 && (cartN ?? 0) === 0) {
    dormant.push(u);
  }
}

console.log(`\n── Dormidos (≥3d, sin listings, sin orders, sin carrito): ${dormant.length} ──`);
for (const u of dormant) {
  const days = Math.floor((now - new Date(u.created_at).getTime()) / (24 * 3600e3));
  console.log(`  ${u.email.padEnd(40)}  ${u.full_name ?? "(sin nombre)"}  · hace ${days}d`);
}

if (!dormant.length) {
  console.log("\nNada que enviar.");
  process.exit(0);
}

if (DRY_RUN) {
  console.log("\n[DRY RUN] — no envío emails. Corre sin --dry-run para enviar.");
  process.exit(0);
}

// 2. Enviar el email. Usamos el helper de lib/email.ts via import dinámico.
const { sendEmail } = await import("../lib/email.ts").catch(async () => {
  // fallback directo
  return {
    sendEmail: async ({ to, subject, html, from = "noreply@tuslibros.cl" }) => {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.warn("[email] RESEND_API_KEY not set — skipping");
        return null;
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject, html }),
      });
      if (!res.ok) {
        console.error("[email] error:", res.status, await res.text());
        return null;
      }
      return res.json();
    },
  };
});

const renderEmail = (name) => {
  const firstName = (name ?? "").split(" ")[0] || "";
  const greeting = firstName ? `Hola ${firstName}` : "Hola";
  return {
    subject: "Te registraste en tuslibros.cl — ¿qué buscabas?",
    html: `<!DOCTYPE html>
<html lang="es-CL">
<body style="margin:0; padding:0; background:#f5f1e8; font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <div style="max-width:540px; margin:0 auto; padding:32px 22px;">

    <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size:24px; color:#1c1c1c; line-height:1.25; margin:0 0 18px;">
      ${greeting} 💛
    </h1>

    <p style="color:#3c3c3c; font-size:15px; line-height:1.6; margin:0 0 16px;">
      Te escribo yo, Vero, de <strong>tuslibros.cl</strong>. Vi que te registraste hace unos días y quería saludarte personalmente.
    </p>

    <p style="color:#3c3c3c; font-size:15px; line-height:1.6; margin:0 0 16px;">
      tuslibros.cl es chico, recién está despegando, y cada usuario me importa de verdad. ¿Qué te trajo? Capaz que pueda ayudarte a encontrar lo que buscabas.
    </p>

    <p style="color:#3c3c3c; font-size:15px; line-height:1.6; margin:0 0 22px;">
      Si tienes libros juntando polvo y no sabes qué hacer con ellos, acá publicarlos toma 10 segundos (escaneas el código de barras y listo). Si andas buscando un libro específico que no encontraste, hay una sección nueva que estrenamos ayer donde los compradores piden y los vendedores publican.
    </p>

    <p style="margin:0 0 28px;">
      <a href="https://tuslibros.cl/vender"
         style="display:inline-block; background:#8a6d2e; color:#ffffff; text-decoration:none; padding:11px 20px; border-radius:6px; font-size:14px; font-weight:600; margin-right:8px;">
        Publicar mis libros
      </a>
      <a href="https://tuslibros.cl/solicitudes"
         style="display:inline-block; background:#ffffff; border:1px solid #c9b78f; color:#6b5b42; text-decoration:none; padding:10px 20px; border-radius:6px; font-size:14px; font-weight:600;">
        Pedir un libro
      </a>
    </p>

    <p style="color:#3c3c3c; font-size:14px; line-height:1.6; margin:0 0 16px;">
      Si prefieres responderme directo por WhatsApp, estoy acá: <a href="https://wa.me/56994583067" style="color:#8a6d2e;">+56 9 9458 3067</a>.
    </p>

    <p style="color:#6b5b42; font-size:14px; line-height:1.5; margin:22px 0 0;">
      Abrazo,<br/>
      <strong>Vero</strong><br/>
      <span style="color:#8a8a8a; font-size:12px;">tuslibros.cl — libros usados en Chile, con envío o retiro en mano</span>
    </p>

    <hr style="border:none; border-top:1px solid #e5ddc8; margin:26px 0 16px;" />
    <p style="color:#b5b5b5; font-size:11px; line-height:1.5; margin:0;">
      Te escribo una sola vez. Si no quieres saber más de tuslibros.cl, ignora este mensaje o responde "no gracias" y no te vuelvo a molestar.
    </p>
  </div>
</body>
</html>`,
  };
};

console.log("\nEnviando emails...");
for (const u of dormant) {
  const { subject, html } = renderEmail(u.full_name);
  const result = await sendEmail({
    to: u.email,
    from: "Vero de tuslibros.cl <noreply@tuslibros.cl>",
    subject,
    html,
  });
  if (result) {
    console.log(`  ✅ ${u.email}`);
  } else {
    console.log(`  ❌ ${u.email}`);
  }
}
