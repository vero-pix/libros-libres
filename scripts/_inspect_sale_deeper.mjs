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

// Listings del bundle
const ids = [
  "8ee8b5fb-70db-467e-a706-16423a1e0934",
  "a6768f48-1cc7-46dd-98fe-29620381ad8a",
  "bfead562-657b-4daa-b989-dc8dd6b94f64",
];
const { data: lis } = await s
  .from("listings")
  .select("id, price, status, book:books(title, author), updated_at")
  .in("id", ids);
console.log("═══ LIBROS DEL BUNDLE ═══");
for (const l of lis ?? []) {
  console.log(`  ${l.id.slice(0,8)}  ${l.status}  $${l.price}  — ${l.book?.title} (${l.book?.author})  [updated ${l.updated_at?.slice(0,19)}]`);
}

// Notifications tabla si existe
const { data: notifs, error: nErr } = await s
  .from("notifications")
  .select("*")
  .eq("user_id", "2201d163-4423-4971-91f0-f6cebd00d1bd")
  .gte("created_at", "2026-04-17")
  .order("created_at", { ascending: false });
console.log("\n═══ NOTIFICACIONES A @vero HOY ═══");
if (nErr) console.log("  (sin tabla notifications o error:", nErr.message, ")");
else console.log(`  ${notifs?.length ?? 0} notificaciones`);
for (const n of notifs ?? []) console.log("   ", JSON.stringify(n));

// Email logs si existe
const { data: emails, error: eErr } = await s
  .from("email_logs")
  .select("*")
  .gte("created_at", "2026-04-17")
  .order("created_at", { ascending: false });
console.log("\n═══ EMAIL LOGS HOY ═══");
if (eErr) console.log("  (sin tabla email_logs:", eErr.message, ")");
else {
  console.log(`  ${emails?.length ?? 0} emails`);
  for (const e of emails ?? []) console.log("   ", e.to ?? e.recipient, "→", e.subject ?? e.template, e.status ?? "");
}
