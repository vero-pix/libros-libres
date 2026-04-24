import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log("🔍 Iniciando diagnóstico de conversión y actividad...");

  // 1. Registros recientes
  const { data: users } = await supabase
    .from("users")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const regsLast7Days = users?.filter(u => {
    const d = new Date(u.created_at);
    return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length || 0;

  // 2. Publicaciones recientes
  const { data: listings } = await supabase
    .from("listings")
    .select("created_at, status")
    .order("created_at", { ascending: false })
    .limit(50);

  const listingsLast7Days = listings?.filter(l => {
    const d = new Date(l.created_at);
    return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length || 0;

  // 3. Búsquedas sin resultados (Demanda insatisfecha)
  const { data: searches } = await supabase
    .from("search_queries")
    .select("query, results_count, created_at")
    .eq("results_count", 0)
    .order("created_at", { ascending: false })
    .limit(20);

  // 4. Intentos de Checkout vs Órdenes finalizadas
  const { data: orders } = await supabase
    .from("orders")
    .select("status, created_at");

  const completedOrders = orders?.filter(o => o.status === "completed").length || 0;
  const pendingOrders = orders?.filter(o => o.status === "pending" || o.status === "waiting_payment").length || 0;

  console.log("\n--- Salud del Marketplace (Últimos 7 días) ---");
  console.log(`Registros nuevos: ${regsLast7Days}`);
  console.log(`Libros publicados: ${listingsLast7Days}`);
  console.log(`Órdenes completadas: ${completedOrders}`);
  console.log(`Pagos pendientes/abandonados: ${pendingOrders}`);

  console.log("\n--- Demanda Insatisfecha (Lo que la gente busca y NO encuentra) ---");
  if (searches && searches.length > 0) {
    const uniqueSearches: Record<string, number> = {};
    searches.forEach(s => {
      const q = s.query.toLowerCase().trim();
      uniqueSearches[q] = (uniqueSearches[q] || 0) + 1;
    });
    Object.entries(uniqueSearches)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([q, count]) => {
        console.log(`- "${q}" (${count} veces)`);
      });
  } else {
    console.log("No hay registros de búsquedas fallidas.");
  }

  console.log("\n--- Análisis de Fricción ---");
  if (pendingOrders > completedOrders * 2) {
    console.log("⚠️ ALERTA: Muchos carritos abandonados. El proceso de pago o el costo de envío podría ser una barrera.");
  }
  if (regsLast7Days > listingsLast7Days * 2) {
    console.log("⚠️ ALERTA: La gente se registra pero NO publica. El formulario de publicación podría ser muy largo o confuso.");
  }
}

diagnose();
