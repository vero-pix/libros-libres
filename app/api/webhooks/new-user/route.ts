import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { sendGong, escapeHtml } from "@/lib/notifications";

const ADMIN_EMAIL = "vero@tuslibros.cl";
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET;

/**
 * Supabase Database Webhook — triggered on INSERT into public.users.
 * Sends email notification to admin when a new user registers.
 *
 * Setup in Supabase Dashboard:
 * 1. Database → Webhooks → Create
 * 2. Table: public.users, Event: INSERT
 * 3. Type: HTTP Request
 * 4. URL: https://tuslibros.cl/api/webhooks/new-user
 * 5. HTTP Headers: { "x-webhook-secret": "<your secret>" }
 */
export async function POST(req: NextRequest) {
  // Verify webhook secret
  if (WEBHOOK_SECRET) {
    const secret = req.headers.get("x-webhook-secret");
    if (secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const record = body.record ?? body;

    const name = record.full_name || "Sin nombre";
    const email = record.email || "Sin email";
    const city = record.city || record.comuna || "No especificada";
    const createdAt = record.created_at
      ? new Date(record.created_at).toLocaleString("es-CL", { timeZone: "America/Santiago" })
      : "Ahora";

    // Email to admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Nuevo usuario en tuslibros.cl — ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#1a1a1a">Nuevo registro en tuslibros.cl</h2>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px 0;color:#666">Nombre</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Ciudad</td><td style="padding:8px 0">${city}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Fecha</td><td style="padding:8px 0">${createdAt}</td></tr>
          </table>
          <a href="https://tuslibros.cl/admin" style="display:inline-block;background:#d4a017;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ver panel admin</a>
          <p style="color:#888;font-size:13px;margin-top:16px">tuslibros.cl</p>
        </div>
      `,
    });

    // GONG: Telegram a Vero
    await sendGong(
      `👤 <b>Nuevo registro</b>\n\n` +
      `Nombre: <b>${escapeHtml(name)}</b>\n` +
      `Ciudad: ${escapeHtml(city)}\n` +
      `Email: ${escapeHtml(email)}`
    ).catch(() => {});

    // Welcome email to user.
    // Voz de Vero, en 1ª persona, y girado a VENDEDOR: por GSC sabemos que el
    // registro llega con intención de vender, no de comprar. Conectar MercadoPago
    // es un paso propio y no una nota al pie — 24 de 50 vendedores activos
    // publican sin MP. Las frases salen de docs/MENSAJES-ONBOARDING-VENDEDOR.md,
    // que es cómo Vero ya le escribe a los vendedores por WhatsApp.
    if (email && email !== "Sin email") {
      // "Sin nombre" es el fallback de arriba: saludar sin nombre antes que
      // mandar un "Hola Sin,".
      const primerNombre = name === "Sin nombre" ? "" : name.split(" ")[0];
      const saludo = primerNombre ? `Hola ${primerNombre}, soy Vero` : "Hola, soy Vero";

      await sendEmail({
        to: email,
        subject: "Soy Vero, de tuslibros.cl — partamos por tu primer libro",
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h1 style="color:#1a1a1a;font-size:24px;margin-bottom:4px">tuslibros.cl</h1>
            <p style="color:#888;font-size:14px;margin-top:0">Cada estantería es una librería</p>

            <h2 style="color:#1a1a1a;font-size:18px;margin-top:24px">${saludo}</h2>

            <p style="color:#333;font-size:15px;line-height:1.6">
              Qué bueno que te animaste. Te dejo los dos pasos que importan, en orden.
            </p>

            <div style="margin:20px 0">
              <div style="background:#f5f0e8;padding:16px;border-radius:12px;margin-bottom:12px">
                <p style="margin:0;font-weight:600;color:#1a1a1a">1. Publica tu primer libro</p>
                <p style="margin:4px 0 0;color:#666;font-size:14px">Escaneas el ISBN o escribes los datos a mano. Es gratis y toma menos de un minuto por libro.</p>
              </div>
              <div style="background:#f5f0e8;padding:16px;border-radius:12px">
                <p style="margin:0;font-weight:600;color:#1a1a1a">2. Conecta tu MercadoPago</p>
                <p style="margin:4px 0 0;color:#666;font-size:14px">Es lo que falta para que te puedan pagar. Sin eso, solo te compra quien coordine contigo en persona. Con MercadoPago te compran desde cualquier región, y la plata te llega directa a ti.</p>
              </div>
            </div>

            <a href="https://tuslibros.cl/publish" style="display:inline-block;background:#d4a017;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">Publicar mi primer libro</a>

            <p style="color:#333;font-size:15px;line-height:1.6;margin-top:24px">
              ¿Cuántos libros tienes en mente? Si son muchos, responde este correo y te paso el importador para que no los subas de a uno.
            </p>

            <p style="color:#888;font-size:13px;margin-top:20px">
              Si algo se traba, escríbeme por <a href="https://wa.me/56994583067" style="color:#d4a017">WhatsApp</a> o mira las <a href="https://tuslibros.cl/faq" style="color:#d4a017">preguntas frecuentes</a>. Dudas, reclamos, ideas — me llegan todas y las leo yo.
            </p>

            <p style="color:#aaa;font-size:12px;margin-top:16px">— Vero</p>
          </div>
        `,
      }).catch((err) => console.error("[new-user] Welcome email error:", err));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[new-user webhook]", err);
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 });
  }
}
