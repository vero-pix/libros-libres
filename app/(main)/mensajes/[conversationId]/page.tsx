import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MessageThread from "@/components/messages/MessageThread";

export const metadata = { title: "Conversación — tuslibros.cl" };

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mensajes");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <Link
            href="/mensajes"
            className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors mb-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Mensajes
          </Link>
        </div>
        <div className="flex-1 flex flex-col bg-cream-warm/30 rounded-t-xl border border-cream-dark/30 border-b-0 overflow-hidden" style={{ minHeight: "60vh" }}>
          <MessageThread conversationId={conversationId} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}
