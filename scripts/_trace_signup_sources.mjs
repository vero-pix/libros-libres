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

// Ver qué columnas tiene pageviews
const { data: sample } = await s.from("pageviews").select("*").limit(1);
if (sample?.length) {
  console.log("Columnas pageviews:", Object.keys(sample[0]).join(", "), "\n");
}

const targets = [
  { email: "far.storm2743@fastmail.com", name: "Jorge Veliz", id: "b905a790" },
  { email: "opusyzmbe@gmail.com", name: "Mikael", id: "2caa47a7" },
  { email: "belenaraya53@gmail.com", name: "Belen Araya", id: "6c75c355" },
  { email: "alejandraschachtebeck@gmail.com", name: "Alejandra Schachtebeck", id: "309b8b4e" },
  { email: "moragaviviana@yahoo.com", name: "Viviana", id: "3f54a6cb" },
  { email: "nicoeltit@gmail.com", name: "Nicolás Eltit", id: "88db8053" },
];

// Traer user full_ids
const { data: users } = await s
  .from("users")
  .select("id, email, created_at")
  .in("email", targets.map((t) => t.email));

for (const u of users ?? []) {
  const target = targets.find((t) => t.email === u.email);
  const signupTime = new Date(u.created_at).getTime();
  // buscar la primera pageview asociada al user (o a la session que acabó siendo suya)
  const { data: pvs } = await s
    .from("pageviews")
    .select("*")
    .eq("user_id", u.id)
    .order("created_at", { ascending: true })
    .limit(5);

  console.log(`\n═══ ${target?.name ?? u.email} ═══`);
  console.log(`   registrado: ${u.created_at}`);
  console.log(`   pageviews del user: ${pvs?.length ?? 0}`);

  if (pvs?.length) {
    // Primera session del user
    const firstSession = pvs[0].session_id;
    // Traer TODAS las pageviews de esa session (puede haber sin user_id antes del login)
    const { data: sessionPvs } = await s
      .from("pageviews")
      .select("*")
      .eq("session_id", firstSession)
      .order("created_at", { ascending: true })
      .limit(20);
    console.log(`   primera session: ${firstSession?.slice(0, 8)} (${sessionPvs?.length ?? 0} pvs)`);
    for (const pv of sessionPvs ?? []) {
      const referrer = pv.referrer ?? pv.referer ?? pv.http_referer ?? "(sin referrer)";
      console.log(`     ${pv.created_at.slice(11, 16)}  ${pv.path ?? pv.url ?? "?"}  ←  ${referrer}`);
    }
  } else {
    // Si no hay user_id vinculado, buscar pageviews por session donde el user se logueó después
    console.log(`   (sin pageviews vinculadas al user_id)`);
  }
}
