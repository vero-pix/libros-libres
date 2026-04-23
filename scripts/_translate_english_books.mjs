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

const translations = [
  {
    id: "91c37daf", // Nietzsche de Safranski
    idFull: null, // se resuelve abajo
    match: "nietzsche",
    description:
      "Con su prosa fulminante, Friedrich Nietzsche (1844–1900) desarraigó el estudio tradicional de la filosofía —anclado en la racionalidad y la verdad— y sentó las bases del radicalismo del pensamiento occidental del siglo XX tal como emergería tras su muerte. Los pensadores contemporáneos han reinterpretado, revisado y repetido sus ideas, pero nadie las ha superado: hoy ningún estudiante de filosofía puede darse el lujo de ignorar la vida y la obra de esta figura mayor.\n\nEn esta biografía central, el aclamado Rüdiger Safranski integra el análisis filosófico con el detalle biográfico para retratar a este hombre difícil, a menudo contradictorio, con una gracia objetiva y equilibrada. Siguiendo la máxima del propio Nietzsche —«la vida es un campo de pruebas para el pensamiento»—, Safranski ofrece una relectura crítica de su filosofía examinando el cruce entre su vida y su obra, e intenta lo que Nietzsche consideraba la más importante de las tareas humanas: ser «un aventurero, un circunnavegante del mundo interior llamado humano».",
  },
  {
    id: "143472cc", // El Cementerio de Praga — Umberto Eco
    idFull: null,
    match: "cementerio de praga",
    description:
      "La Europa del siglo XIX —de Turín a Praga y de Praga a París— está llena de lo macabro y lo misterioso. Los jesuitas conspiran contra los masones. En Italia, republicanos estrangulan sacerdotes con sus propias entrañas. En Francia, durante la Comuna de París, la gente come ratones, planea atentados y rebeliones en las calles, y celebra misas negras. Cada nación tiene su propio servicio secreto, urdiendo conspiraciones e incluso masacres. Hay barbas falsas, abogados falsos, testamentos falsos y hasta muertes falsas. Del caso Dreyfus a los Protocolos de los Sabios de Sion, los judíos son culpados de todo.\n\nUn solo hombre entrelaza cada uno de estos hilos en una colosal conspiración de conspiraciones. Aquí lo confiesa todo, gracias a la ingeniosa imaginación de Umberto Eco — un recorrido vertiginoso por los bajos fondos de hechos reales que sacudieron al mundo.",
  },
];

// Resolver IDs completos desde la BD
for (const t of translations) {
  const { data } = await s
    .from("books")
    .select("id, title")
    .ilike("title", `%${t.match}%`);
  const matched = (data ?? []).find((b) => b.id.startsWith(t.id));
  if (!matched) {
    console.error(`❌ No encontré book con id ${t.id} y título ~${t.match}`);
    continue;
  }
  t.idFull = matched.id;
  console.log(`  found: ${matched.id}  "${matched.title}"`);
}

// Aplicar updates
for (const t of translations) {
  if (!t.idFull) continue;
  const { error } = await s
    .from("books")
    .update({ description: t.description })
    .eq("id", t.idFull);
  if (error) {
    console.error(`❌ Error updating ${t.idFull}:`, error.message);
  } else {
    console.log(`✅ Traducida: ${t.idFull}`);
  }
}
