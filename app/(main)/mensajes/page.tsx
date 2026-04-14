import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConversationList from "@/components/messages/ConversationList";

export const metadata = { title: "Mensajes — tuslibros.cl" };

interface Props {
  searchParams: { to?: string };
}

export default async function MensajesPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mensajes");

  const targetUserId = searchParams.to;

  // Si viene ?to=userId, buscar o crear conversación con esa persona
  if (targetUserId && targetUserId !== user.id) {
    // Buscar conversación existente
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant_1.eq.${user.id},participant_2.eq.${targetUserId}),and(participant_1.eq.${targetUserId},participant_2.eq.${user.id})`
      )
      .limit(1)
      .single();

    if (existing) {
      redirect(`/mensajes/${existing.id}`);
    }

    // Crear conversación nueva
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        participant_1: user.id,
        participant_2: targetUserId,
      })
      .select("id")
      .single();

    if (newConv) {
      redirect(`/mensajes/${newConv.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mensajes</h1>
        <ConversationList />
      </main>
    </div>
  );
}
