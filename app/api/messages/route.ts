import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

function orderParticipants(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

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

  let convId = conversation_id;

  // Find or create conversation
  if (!convId) {
    if (!recipient_id) {
      return NextResponse.json({ error: "Falta destinatario" }, { status: 400 });
    }
    if (recipient_id === user.id) {
      return NextResponse.json({ error: "No puedes enviarte mensajes a ti mismo" }, { status: 400 });
    }

    const [p1, p2] = orderParticipants(user.id, recipient_id);

    // Try to find existing conversation for this pair + listing
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("participant_1", p1)
      .eq("participant_2", p2)
      .eq("listing_id", listing_id ?? null)
      .maybeSingle();

    if (existing) {
      convId = existing.id;
    } else {
      const { data: newConv, error: convErr } = await supabase
        .from("conversations")
        .insert({
          participant_1: p1,
          participant_2: p2,
          listing_id: listing_id ?? null,
        })
        .select("id")
        .single();

      if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500 });
      convId = newConv.id;
    }
  }

  // Insert message
  const { data: message, error: msgErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: convId,
      sender_id: user.id,
      body: body.trim(),
    })
    .select("id, created_at")
    .single();

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  // Update conversation timestamp
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", convId);

  // Send email notification to recipient
  try {
    const actualRecipientId = recipient_id || await getOtherParticipant(supabase, convId, user.id);
    if (actualRecipientId) {
      const { data: recipient } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("id", actualRecipientId)
        .single();

      const { data: sender } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (recipient?.email) {
        await sendEmail({
          to: recipient.email,
          subject: `Nuevo mensaje de ${sender?.full_name ?? "un usuario"} — tuslibros.cl`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#1a1a1a">Tienes un nuevo mensaje</h2>
              <p><strong>${sender?.full_name ?? "Un usuario"}</strong> te escribió:</p>
              <div style="background:#f5f5f4;padding:16px;border-radius:8px;margin:16px 0">
                <p style="margin:0;color:#374151">${body.trim().substring(0, 300)}</p>
              </div>
              <a href="https://tuslibros.cl/mensajes/${convId}" style="display:inline-block;background:#8B5CF6;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
                Responder
              </a>
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

async function getOtherParticipant(supabase: Awaited<ReturnType<typeof createClient>>, convId: string, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("conversations")
    .select("participant_1, participant_2")
    .eq("id", convId)
    .single();

  if (!data) return null;
  return data.participant_1 === userId ? data.participant_2 : data.participant_1;
}
