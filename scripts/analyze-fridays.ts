import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Simple parser para .env.local sin dependencias
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan credenciales de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyze() {
  console.log("📊 Iniciando análisis de tráfico histórico...");

  const { data, error } = await supabase
    .from("page_views")
    .select("created_at, path")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error al obtener datos:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No hay datos de analítica suficientes aún.");
    return;
  }

  const viewsByDay: Record<number, number> = {}; // 0-6 (domingo-sábado)
  const viewsByHourFriday: Record<number, number> = {};
  const pathsFriday: Record<string, number> = {};
  const totalDays = new Set<string>();
  const totalFridays = new Set<string>();

  data.forEach((view) => {
    const date = new Date(view.created_at);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    const dateStr = date.toISOString().split("T")[0];

    totalDays.add(dateStr);
    viewsByDay[dayOfWeek] = (viewsByDay[dayOfWeek] || 0) + 1;

    if (dayOfWeek === 5) { // Viernes
      totalFridays.add(dateStr);
      viewsByHourFriday[hour] = (viewsByHourFriday[hour] || 0) + 1;
      pathsFriday[view.path] = (pathsFriday[view.path] || 0) + 1;
    }
  });

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  
  console.log("\n--- Resumen por día de la semana (Promedio visitas/día) ---");
  dayNames.forEach((name, i) => {
    const count = viewsByDay[i] || 0;
    const occurrences = Array.from(totalDays).filter(d => {
        // Ajuste de zona horaria simple para el filtro
        const dObj = new Date(d + "T12:00:00");
        return dObj.getDay() === i;
    }).length;
    const avg = occurrences > 0 ? (count / occurrences).toFixed(1) : 0;
    console.log(`${name.padEnd(10)}: ${avg} visitas/día`);
  });

  console.log("\n--- Comportamiento los VIERNES ---");
  console.log(`Días analizados: ${totalFridays.size}`);
  
  if (totalFridays.size > 0) {
    console.log("\nTop horas pico (Viernes):");
    Object.entries(viewsByHourFriday)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([hour, count]) => {
        console.log(`${hour.padStart(2, '0')}:00 hrs: ${Math.round(count / totalFridays.size)} visitas promedio`);
      });

    console.log("\nTop 5 páginas más vistas (Viernes):");
    Object.entries(pathsFriday)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([path, count]) => {
        console.log(`${path.padEnd(30)}: ${count} vistas totales`);
      });
  } else {
    console.log("No hay datos de viernes registrados todavía.");
  }
}

analyze();
