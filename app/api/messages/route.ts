import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendEmail } from "@/lib/email";
import { detectarPagoFuera } from "@/lib/pagoFueraDetector";
import { buscarOCrearConversacion } from "@/lib/conversations";
import { sendGong, escapeHtml } from "@/lib/notifications";

/** GET /api/messages — list conversations for current user */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Fetch conversations where user is participant
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(`
      id, listing_id, created_at, updated_at,
      participant_1, participant_2,
      p1:users!conversations_participant_1_fkey(id, full_name, avatar_url),
      p2:users!conversations_participant_2_fkey(id, full_name, avatar_url),
      listing:listings(id, book:books(title))
    `)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // For each conversation, get last message and unread count
  const results = await Promise.all(
    (conversations ?? []).map(async (conv) => {
      const other = conv.participant_1 === user.id ? conv.p2 : conv.p1;

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("body, sender_id, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .is("read_at", null);

      return {
        id: conv.id,
        other_user: other,
        listing: conv.listing,
        last_message: lastMsg,
        unread_count: count ?? 0,
        updated_at: conv.updated_at,
      };
    })
  );

  return NextResponse.json({ conversations: results });
}

// Phishing del 03-10-2026: una cuenta nueva con nombre "Tuslibros" mandó 48
// mensajes con un link falso de "verificar tu identidad", y el aviso legítimo
// por correo (hola@tuslibros.cl) los hizo creíbles. Tres frenos: sin links
// externos en el chat, tope para cuentas nuevas y sin firmar como la marca.
// Una hora después llegó el segundo intento con un dominio cirílico
// (ъыъ.рф/tuslibros), que la lista de terminaciones latinas no veía: por eso
// también cuenta cualquier "algo.algo/" y cualquier terminación no latina.
const LINK_EXTERNO = new RegExp(
  [
    "https?://",
    "www\\.",
    "[\\p{L}\\p{N}-]+\\.[\\p{L}]{2,}\\s*/",
    "[\\p{L}\\p{N}-]+\\.(?:com|net|org|info|ink|io|co|us|ly|me|xyz|top|site|online|app|link|click|cc|tk|ru|cn|su|ws|to|gl|gd|sh)(?![\\p{L}\\p{N}])",
    "[\\p{L}\\p{N}-]+\\.[^\\x00-\\x7F\\s.,;:!?)]{2,}",
  ].join("|"),
  "iu",
);
const NOMBRE_DE_LA_MARCA = /tus\s*libros|soporte|support|admin|verificaci[oó]n/i;

function tieneLinkExterno(texto: string): boolean {
  const sinPropios = texto.replace(/(?:https?:\/\/)?(?:www\.)?tuslibros\.cl\S*/gi, "");
  return LINK_EXTERNO.test(sinPropios);
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** POST /api/messages — send a message (find-or-create conversation) */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { recipient_id, listing_id, body, conversation_id } = await req.json();

  if (!body?.trim()) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }
  if (body.length > 2000) {
    return NextResponse.json({ error: "Mensaje muy largo (máx 2000 caracteres)" }, { status: 400 });
  }
  const diasDeCuenta = (Date.now() - new Date(user.created_at).getTime()) / 86_400_000;
  const cuentaNueva = diasDeCuenta < 7;

  if (tieneLinkExterno(body)) {
    if (cuentaNueva) {
      await alertarVero(supabase, user.id, diasDeCuenta, "intentó mandar un link (bloqueado)", body);
    }
    return NextResponse.json(
      { error: "Por seguridad no se pueden enviar links en los mensajes. Cuéntale con palabras o por WhatsApp." },
      { status: 400 },
    );
  }

  // Cuentas de menos de 7 días: máximo 10 mensajes por hora. Un comprador
  // real escribe a dos o tres vendedores, no a cuarenta y ocho en media hora.
  let enviadosUltimaHora = 0;
  if (cuentaNueva) {
    const { count: enviados } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
    enviadosUltimaHora = enviados ?? 0;
    if (enviadosUltimaHora >= 10) {
      return NextResponse.json(
        { error: "Escribiste muchos mensajes seguidos. Espera un rato y sigue." },
        { status: 429 },
      );
    }
  }

  let convId = conversation_id;

  // Find or create conversation
  if (!convId) {
    if (!recipient_id) {
      return NextResponse.json({ error: "Falta destinatario" }, { status: 400 });
    }
    if (recipient_id === user.id) {
      return NextResponse.json({ error: "No puedes enviarte mensajes a ti mismo" }, { status: 400 });
    }

    const conv = await buscarOCrearConversacion(supabase, user.id, recipient_id, listing_id ?? null);
    if ("error" in conv) return NextResponse.json({ error: conv.error }, { status: 500 });
    convId = conv.id;
  }

  // Insert message. flagged_reason deja constancia si el texto trae teléfono,
  // transferencia o efectivo (lib/pagoFueraDetector.ts); no bloquea el envío.
  // Tolerante como logWebhook con mp_webhook_log: si la columna todavía no
  // existe (migración 20260907 sin aplicar), se reintenta sin ella. Un aviso
  // de fraude nunca puede tumbar el envío de un mensaje.
  const base = { conversation_id: convId, sender_id: user.id, body: body.trim() };
  const flagged_reason = detectarPagoFuera(body);
  let { data: message, error: msgErr } = await supabase
    .from("messages")
    .insert({ ...base, flagged_reason })
    .select("id, created_at")
    .single();

  if (msgErr && /flagged_reason/i.test(msgErr.message)) {
    console.error("[messages] no se pudo guardar flagged_reason:", msgErr.message);
    ({ data: message, error: msgErr } = await supabase
      .from("messages")
      .insert(base)
      .select("id, created_at")
      .single());
  }

  if (msgErr || !message) return NextResponse.json({ error: msgErr?.message ?? "No se pudo guardar" }, { status: 500 });

  // Alerta temprana: una cuenta nueva que llega a 5 mensajes en una hora.
  // El 03-10-2026 Vero se enteró del phishing por WhatsApp de los vendedores.
  if (cuentaNueva && enviadosUltimaHora === 4) {
    await alertarVero(supabase, user.id, diasDeCuenta, "lleva 5 mensajes en la última hora", body);
  }

  // Update conversation timestamp
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", convId);

  // Send email notification to recipient
  try {
    const actualRecipientId = recipient_id || await getOtherParticipant(supabase, convId, user.id);
    if (actualRecipientId) {
      // El correo del otro no se lee con la sesión: `users.email` no está
      // concedido a authenticated (20260923e). Lo lee el servidor.
      const { data: recipient } = await createServiceRoleClient()
        .from("users")
        .select("email, full_name")
        .eq("id", actualRecipientId)
        .single();

      const { data: sender } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Nadie firma como la marca: un nombre que imita a tuslibros sale como
      // "un usuario" en el aviso, y el correo avisa que tuslibros nunca pide
      // verificar la identidad por mensaje.
      const nombreSeguro =
        sender?.full_name && !NOMBRE_DE_LA_MARCA.test(sender.full_name)
          ? escaparHtml(sender.full_name)
          : "Un usuario";

      if (recipient?.email) {
        await sendEmail({
          to: recipient.email,
          subject: `Nuevo mensaje de ${nombreSeguro.replace(/&[a-z]+;/g, "")} — tuslibros.cl`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#1a1a1a">Tienes un nuevo mensaje</h2>
              <p><strong>${nombreSeguro}</strong> te escribió:</p>
              <div style="background:#f5f5f4;padding:16px;border-radius:8px;margin:16px 0">
                <p style="margin:0;color:#374151">${
                  cuentaNueva
                    ? "Es una cuenta nueva: por seguridad, el mensaje se lee solo en el sitio."
                    : escaparHtml(body.trim().substring(0, 300))
                }</p>
              </div>
              <a href="https://tuslibros.cl/mensajes/${convId}" style="display:inline-block;background:#8B5CF6;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
                Responder
              </a>
              <p style="color:#6b7280;font-size:12px;margin-top:20px">Tuslibros nunca te pide verificar tu identidad, tu clave ni tus datos por mensaje. Si un mensaje te lo pide, es un engaño: no hagas clic.</p>
            </div>
          `,
        });
      }
    }
  } catch {
    // Email failure shouldn't block message sending
  }

  return NextResponse.json({ conversation_id: convId, message_id: message.id });
}

async function alertarVero(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  dias: number,
  que: string,
  texto: string,
) {
  try {
    const { data: u } = await supabase.from("users").select("username, full_name").eq("id", userId).single();
    const quien = u?.username ? `@${u.username}` : userId;
    await sendGong(
      `🎣 <b>Cuenta nueva ${escapeHtml(que)}</b>\n` +
        `${escapeHtml(quien)} (${escapeHtml(u?.full_name ?? "sin nombre")}), creada hace ${dias < 1 ? "menos de un día" : `${Math.floor(dias)} días`}\n` +
        `«${escapeHtml(texto.trim().slice(0, 200))}»\n` +
        `Si es phishing: banned_until en auth.users.`,
    );
  } catch {
    // Una alerta caída nunca frena el mensaje.
  }
}

async function getOtherParticipant(supabase: Awaited<ReturnType<typeof createClient>>, convId: string, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("conversations")
    .select("participant_1, participant_2")
    .eq("id", convId)
    .single();

  if (!data) return null;
  return data.participant_1 === userId ? data.participant_2 : data.participant_1;
}
