import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 1. Ver qué tablas de mensajería existen
const tables = ["messages", "conversations", "chat_messages"];
for (const t of tables) {
  const { count, error } = await s.from(t).select("*", { count: "exact", head: true });
  if (error) continue;
  console.log(`Tabla "${t}": ${count} rows`);
}

// 2. Traer los mensajes reales
const { data: messages, error } = await s
  .from("messages")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(30);

if (error) {
  console.error("Err:", error);
  process.exit(1);
}

console.log(`\nÚltimos mensajes: ${messages?.length}\n`);
if (!messages?.length) {
  console.log("(sin mensajes)");
  process.exit(0);
}

const userIds = [...new Set(messages.flatMap((m) => [m.sender_id, m.recipient_id].filter(Boolean)))];
const { data: users } = await s.from("users").select("id, full_name, email, username").in("id", userIds);
const byId = Object.fromEntries((users ?? []).map((u) => [u.id, u]));

for (const m of messages) {
  const sender = byId[m.sender_id];
  const recipient = byId[m.recipient_id];
  const senderLabel = sender ? `${sender.full_name} (${sender.email})` : m.sender_id?.slice(0, 8) ?? "?";
  const recipientLabel = recipient ? `${recipient.full_name} (${recipient.email})` : m.recipient_id?.slice(0, 8) ?? "?";
  const body = (m.body ?? m.content ?? m.message ?? "").slice(0, 120);
  console.log(`${m.created_at.slice(0, 16)}  ${senderLabel}  →  ${recipientLabel}`);
  console.log(`  "${body}${body.length >= 120 ? "..." : ""}"`);
  if (m.listing_id) console.log(`  · sobre listing ${m.listing_id.slice(0, 8)}`);
  console.log();
}
