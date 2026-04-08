"use client";

import { useState, useEffect, useRef } from "react";
import Avatar from "@/components/ui/Avatar";

interface Message {
  id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

interface ConversationInfo {
  id: string;
  other_user: { id: string; full_name: string; avatar_url: string | null };
  listing: { id: string; book: { title: string; author: string; cover_url: string | null } } | null;
}

interface Props {
  conversationId: string;
  currentUserId: string;
}

export default function MessageThread({ conversationId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conv, setConv] = useState<ConversationInfo | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setConv(data.conversation);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId, body: body.trim() }),
      });
      if (res.ok) {
        setBody("");
        await fetchMessages();
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div className="text-center py-16 text-ink-muted">Cargando mensajes...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {conv && (
        <div className="flex items-center gap-3 p-4 bg-white border-b border-cream-dark/30">
          <Avatar src={conv.other_user.avatar_url} alt={conv.other_user.full_name} fallbackLetter={conv.other_user.full_name?.[0] ?? "?"} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold text-ink text-sm">{conv.other_user.full_name}</p>
            {conv.listing && (
              <p className="text-[10px] text-brand-500 truncate">{conv.listing.book.title}</p>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            Envía el primer mensaje para iniciar la conversación.
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                  isMine
                    ? "bg-brand-500 text-white rounded-br-md"
                    : "bg-white border border-cream-dark/30 text-ink rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-gray-400"}`}>
                  {new Date(msg.created_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-cream-dark/30 flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe un mensaje..."
          maxLength={2000}
          className="flex-1 px-4 py-2.5 border border-cream-dark/30 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}
