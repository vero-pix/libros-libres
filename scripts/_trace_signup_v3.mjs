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

const targets = [
  { email: "far.storm2743@fastmail.com", name: "Jorge Veliz (HOY)" },
  { email: "opusyzmbe@gmail.com", name: "Mikael" },
  { email: "belenaraya53@gmail.com", name: "Belen Araya" },
  { email: "alejandraschachtebeck@gmail.com", name: "Alejandra Schachtebeck" },
  { email: "moragaviviana@yahoo.com", name: "Viviana" },
  { email: "nicoeltit@gmail.com", name: "Nicolás Eltit" },
];

const { data: users } = await s
  .from("users")
  .select("id, email, created_at")
  .in("email", targets.map((t) => t.email));

for (const u of users ?? []) {
  const target = targets.find((t) => t.email === u.email);
  console.log(`\n═══ ${target.name} ═══`);
  console.log(`   user_id: ${u.id.slice(0, 8)}  |  registrado: ${u.created_at.slice(0, 16)}`);

  // 1. Pageviews vinculadas al user_id (actividad post-login)
  const { data: ownPvs } = await s
    .from("page_views")
    .select("session_id, path, referrer, country, created_at")
    .eq("user_id", u.id)
    .order("created_at", { ascending: true });

  console.log(`   pvs con user_id: ${ownPvs?.length ?? 0}`);

  // Extraer session_ids únicos vinculados a este user
  const userSessions = [...new Set((ownPvs ?? []).map((p) => p.session_id))];
  console.log(`   sessions del user: ${userSessions.length}`);

  // 2. Para cada session del user, traer TODAS las pageviews de esa session
  //    (incluyendo las ANTES de loguearse, que no tienen user_id pero sí session_id)
  for (const sid of userSessions.slice(0, 2)) {
    const { data: fullSession } = await s
      .from("page_views")
      .select("path, referrer, country, user_id, created_at")
      .eq("session_id", sid)
      .order("created_at", { ascending: true });

    if (!fullSession?.length) continue;
    const first = fullSession[0];
    const ref = first.referrer ?? "(directo)";
    console.log(`   ┌ session ${sid.slice(0, 8)} — ${fullSession.length} pvs`);
    console.log(`   │   first hit: ${first.path}  ←  ${ref}  [${first.country ?? "?"}]`);
    for (const pv of fullSession.slice(0, 8)) {
      const marker = pv.user_id ? "✓" : " ";
      console.log(`   │ ${marker} ${pv.created_at.slice(11, 19)}  ${pv.path}`);
    }
    if (fullSession.length > 8) console.log(`   │   ...+${fullSession.length - 8} más`);
    console.log(`   └`);
  }
}
