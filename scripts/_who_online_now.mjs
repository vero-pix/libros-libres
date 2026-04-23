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

const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();

const { data: views } = await s
  .from("page_views")
  .select("session_id, user_id, path, created_at")
  .gte("created_at", since)
  .order("created_at", { ascending: false });

const bySession = new Map();
for (const v of views ?? []) {
  if (!bySession.has(v.session_id)) {
    bySession.set(v.session_id, { userId: v.user_id, paths: [], first: v.created_at, last: v.created_at });
  }
  const e = bySession.get(v.session_id);
  if (v.user_id && !e.userId) e.userId = v.user_id;
  e.paths.push({ path: v.path, at: v.created_at });
  if (v.created_at < e.first) e.first = v.created_at;
  if (v.created_at > e.last) e.last = v.created_at;
}

console.log(`\n═══ ${bySession.size} SESIONES EN LOS ÚLTIMOS 30 MIN ═══\n`);

for (const [sid, e] of bySession) {
  let who = "anónimo";
  if (e.userId) {
    const { data: u } = await s
      .from("users")
      .select("full_name, username, email")
      .eq("id", e.userId)
      .single();
    who = `${u?.full_name ?? "?"} (${u?.email ?? ""}) ${u?.username ? "@" + u.username : ""}`;
  }
  const minsAgo = Math.round((Date.now() - new Date(e.last).getTime()) / 60000);
  console.log(`🧑 ${who}`);
  console.log(`   sesión ${sid.slice(0, 8)} · ${e.paths.length} páginas · última hace ${minsAgo} min`);
  const uniquePaths = [...new Set(e.paths.map((p) => p.path))];
  console.log(`   recorrido: ${uniquePaths.slice(0, 8).join(" → ")}`);
  console.log();
}
