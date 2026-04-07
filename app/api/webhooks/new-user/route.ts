import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

const ADMIN_EMAIL = "vero@economics.cl";
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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[new-user webhook]", err);
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 });
  }
}
