import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { sendGong, escapeHtml } from "@/lib/notifications";
import { createPublicClient } from "@/lib/supabase/public";
import { VERO_INBOX } from "@/lib/veroInbox";

const ADMIN_EMAIL = VERO_INBOX;
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

      // El bloque de comprador menciona cuántos libros hay. Se lee de la BD:
      // hardcodearlo ya pasó en /login, donde decía "500+" con 1.900 publicados.
      // Si la consulta falla, la frase se arma sin número en vez de mentir.
      let librosActivos: number | null = null;
      try {
        const { count } = await createPublicClient()
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("status", "active");
        librosActivos = count ?? null;
      } catch {
        librosActivos = null;
      }
      const cuantos = librosActivos
        ? `${librosActivos.toLocaleString("es-CL")} libros usados publicados`
        : "libros usados publicados";

      await sendEmail({
        to: email,
        subject: "Soy Vero, de tuslibros.cl — partamos por tu primer libro",
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h1 style="color:#1a1a1a;font-size:24px;margin-bottom:4px">tuslibros.cl</h1>
            <p style="color:#888;font-size:14px;margin-top:0">Cada estantería es una librería</p>

            <h2 style="color:#1a1a1a;font-size:18px;margin-top:24px">${saludo}</h2>

            <p style="color:#333;font-size:15px;line-height:1.6">
              Qué bueno que te animaste. Son tres pasos, y cada uno tiene su link acá abajo.
            </p>

            <div style="margin:20px 0">
              <div style="background:#f5f0e8;padding:16px;border-radius:12px;margin-bottom:12px">
                <p style="margin:0;font-weight:600;color:#1a1a1a">1. Publica tu primer libro</p>
                <p style="margin:4px 0 8px;color:#666;font-size:14px">Escaneas el ISBN o escribes los datos a mano. Es gratis y toma menos de un minuto por libro.</p>
                <a href="https://tuslibros.cl/publish" style="color:#d4a017;font-size:14px;font-weight:600;text-decoration:none">Publicar un libro →</a>
              </div>

              <div style="background:#f5f0e8;padding:16px;border-radius:12px;margin-bottom:12px">
                <p style="margin:0;font-weight:600;color:#1a1a1a">2. Conecta tu MercadoPago</p>
                <p style="margin:4px 0 8px;color:#666;font-size:14px">Es lo que falta para que te puedan pagar. Sin eso, solo te compra quien coordine contigo en persona. Con MercadoPago te compran desde cualquier región y la plata te llega directa a ti.<br><br>En la misma página puedes activar el despacho con Shipit: imprimes la etiqueta y un courier pasa a buscar el libro a tu casa. No tienes que ir a ninguna oficina.</p>
                <a href="https://tuslibros.cl/perfil" style="color:#d4a017;font-size:14px;font-weight:600;text-decoration:none">Conectar MercadoPago y Shipit →</a>
              </div>

              <div style="background:#f5f0e8;padding:16px;border-radius:12px">
                <p style="margin:0;font-weight:600;color:#1a1a1a">3. Cuenta quién eres</p>
                <p style="margin:4px 0 8px;color:#666;font-size:14px">Tu foto y unas líneas tuyas. La gente le compra a personas, no a catálogos — y se nota en las ventas.<br><br>Yo cuento por qué armé esto: en cada ventana de la ciudad hay una estantería, y en cada estantería un libro que no sé que existe. Una razón vende más que una lista de géneros.</p>
                <a href="https://tuslibros.cl/perfil" style="color:#d4a017;font-size:14px;font-weight:600;text-decoration:none">Completar mi perfil →</a>
                <span style="color:#bbb">&nbsp;·&nbsp;</span>
                <a href="https://tuslibros.cl/vendedor/vero" style="color:#d4a017;font-size:14px;text-decoration:none">ver el ejemplo</a>
              </div>
            </div>

            <a href="https://tuslibros.cl/publish" style="display:inline-block;background:#d4a017;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">Empezar por mi primer libro</a>

            <p style="color:#333;font-size:15px;line-height:1.6;margin-top:24px">
              ¿Cuántos libros tienes en mente? Si son muchos, responde este correo y te paso el importador para que no los subas de a uno.
            </p>

            <div style="border-top:1px solid #e8e0d4;margin-top:28px;padding-top:22px">
              <p style="margin:0 0 6px;font-weight:600;color:#1a1a1a;font-size:16px">¿Y si en realidad viniste a comprar?</p>
              <p style="margin:0 0 14px;color:#333;font-size:15px;line-height:1.6">
                También sirve. Acá hay ${cuantos} por gente en todo Chile, y se busca por autor, título o género.
              </p>
              <a href="https://tuslibros.cl/search" style="display:inline-block;background:#f5f0e8;color:#1a1a1a;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">Buscar un libro →</a>

              <p style="margin:18px 0 12px;color:#333;font-size:15px;line-height:1.6">
                Y si no está el que andas buscando, déjalo pedido. Le llega a los vendedores y yo te aviso cuando aparezca.
              </p>
              <a href="https://tuslibros.cl/solicitudes" style="display:inline-block;background:#f5f0e8;color:#1a1a1a;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">Pedir un libro →</a>
            </div>

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
