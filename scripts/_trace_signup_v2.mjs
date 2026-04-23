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

// Ver columnas
const { data: sample } = await s.from("page_views").select("*").limit(1);
console.log("Columnas pageviews:", Object.keys(sample?.[0] ?? {}).join(", "), "\n");

const targets = [
  { name: "Jorge Veliz (HOY)", signup: "2026-04-19T16:50:09" },
  { name: "Mikael", signup: "2026-04-18T01:57:18" },
  { name: "Belen Araya", signup: "2026-04-13T22:09:12" },
  { name: "Alejandra", signup: "2026-04-10T15:23:50" },
  { name: "Viviana", signup: "2026-04-02T17:45:20" },
  { name: "Nicolás Eltit", signup: "2026-04-16T22:43:35" },
];

for (const t of targets) {
  const signupTime = new Date(t.signup).getTime();
  const windowBefore = new Date(signupTime - 45 * 60 * 1000).toISOString(); // 45 min antes
  const windowAfter = new Date(signupTime + 10 * 60 * 1000).toISOString(); // 10 min después

  // Buscar todas las pageviews en la ventana que tengan /register, /login, / en el path
  const { data: pvs } = await s
    .from("page_views")
    .select("*")
    .gte("created_at", windowBefore)
    .lte("created_at", windowAfter)
    .order("created_at", { ascending: true });

  // Agrupar por session
  const sessions = {};
  for (const pv of pvs ?? []) {
    const sid = pv.session_id;
    if (!sid) continue;
    sessions[sid] = sessions[sid] || [];
    sessions[sid].push(pv);
  }

  // Filtrar sessions que hayan tocado /register o /login
  const candidateSessions = Object.entries(sessions).filter(([_, pvs]) =>
    pvs.some((p) => /register|login|signup/i.test(p.path ?? p.url ?? ""))
  );

  console.log(`═══ ${t.name} (registrado ${t.signup}) ═══`);
  console.log(`   sessions candidatas (que tocaron /register o /login): ${candidateSessions.length}`);

  for (const [sid, pvs] of candidateSessions.slice(0, 3)) {
    console.log(`   ┌ session ${sid.slice(0, 8)} (${pvs.length} pvs)`);
    const firstPv = pvs[0];
    const ref = firstPv.referrer ?? firstPv.referer ?? firstPv.http_referer ?? firstPv.source ?? "(sin referrer)";
    console.log(`   │   entró por: ${firstPv.path ?? firstPv.url ?? "?"}  ←  ${ref}`);
    for (const pv of pvs.slice(0, 10)) {
      console.log(`   │   ${pv.created_at.slice(11, 19)}  ${pv.path ?? pv.url ?? "?"}`);
    }
    console.log(`   └`);
  }
  console.log();
}
