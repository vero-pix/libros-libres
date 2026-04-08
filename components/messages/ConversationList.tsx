"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";

interface Conversation {
  id: string;
  other_user: { id: string; full_name: string; avatar_url: string | null };
  listing: { id: string; book: { title: string } } | null;
  last_message: { body: string; sender_id: string; created_at: string } | null;
  unread_count: number;
  updated_at: string;
}

export default function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchConversations() {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-muted">Cargando conversaciones...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
        <p className="text-gray-500 text-lg">No tienes mensajes aún</p>
        <p className="text-sm text-gray-400 mt-1">
          Cuando envíes o recibas un mensaje, aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/mensajes/${conv.id}`}
          className={`flex items-center gap-3 p-4 rounded-xl border transition-colors hover:bg-brand-50/30 ${
            conv.unread_count > 0
              ? "bg-brand-50/20 border-brand-200"
              : "bg-white border-cream-dark/30"
          }`}
        >
          <Avatar
            src={conv.other_user.avatar_url}
            alt={conv.other_user.full_name}
            fallbackLetter={conv.other_user.full_name?.[0] ?? "?"}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm truncate ${conv.unread_count > 0 ? "font-bold text-ink" : "font-medium text-ink"}`}>
                {conv.other_user.full_name}
              </span>
              {conv.last_message && (
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {formatTime(conv.last_message.created_at)}
                </span>
              )}
            </div>
            {conv.listing && (
              <p className="text-[10px] text-brand-500 truncate">
                {conv.listing.book.title}
              </p>
            )}
            {conv.last_message && (
              <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? "text-ink font-medium" : "text-gray-400"}`}>
                {conv.last_message.body}
              </p>
            )}
          </div>
          {conv.unread_count > 0 && (
            <span className="bg-brand-500 text-white text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5 flex-shrink-0">
              {conv.unread_count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return d.toLocaleDateString("es-CL", { weekday: "short" });
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}
