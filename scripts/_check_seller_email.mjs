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

const { data: vero } = await s
  .from("users")
  .select("id, email, full_name, username, phone")
  .eq("id", "2201d163-4423-4971-91f0-f6cebd00d1bd")
  .single();
console.log("@vero seller row:", vero);

// Para comparar, seller de orden de Zdravko (14 abril, La Marina)
const { data: zOrder } = await s
  .from("orders")
  .select("id, seller_id, buyer_id, bundle_id, total, status, created_at")
  .gte("created_at", "2026-04-07")
  .lte("created_at", "2026-04-08")
  .order("created_at", { ascending: false });
console.log("\nOrden de Zdravko (7 abril):", zOrder);

// ¿hay tabla webhook_logs?
const { error: wlErr } = await s.from("webhook_logs").select("id").limit(1);
console.log("\nwebhook_logs existe?", wlErr ? "NO — " + wlErr.message : "SÍ");
