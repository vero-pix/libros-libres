import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/messages/[conversationId] — message history + mark as read */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Verify user is participant
  const { data: conv } = await supabase
    .from("conversations")
    .select(`
      id, listing_id,
      participant_1, participant_2,
      p1:users!conversations_participant_1_fkey(id, full_name, avatar_url),
      p2:users!conversations_participant_2_fkey(id, full_name, avatar_url),
      listing:listings(id, book:books(title, author, cover_url))
    `)
    .eq("id", conversationId)
    .single();

  if (!conv) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });

  if (conv.participant_1 !== user.id && conv.participant_2 !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const other = conv.participant_1 === user.id ? conv.p2 : conv.p1;

  // Fetch messages
  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, sender_id, body, read_at, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark unread messages from other user as read
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  return NextResponse.json({
    conversation: {
      id: conv.id,
      other_user: other,
      listing: conv.listing,
    },
    messages: messages ?? [],
  });
}
