import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const BASE = "https://tuslibros.cl";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 1. Insertar key de prueba para vero
const TEST_KEY = "tl_test_" + Math.random().toString(36).slice(2);
const VERO_ID = "2201d163-4423-4971-91f0-f6cebd00d1bd";

const { error: insertErr } = await supabase.from("api_keys").insert({ seller_id: VERO_ID, key: TEST_KEY, name: "Test CI" });
if (insertErr) { console.error("❌ No se pudo insertar key de prueba:", insertErr.message); process.exit(1); }
console.log("✅ API key de prueba insertada:", TEST_KEY.slice(0, 20) + "...");

const h = { "Authorization": `Bearer ${TEST_KEY}`, "Content-Type": "application/json" };

async function test(label, method, path, body) {
  const opts = { method, headers: h };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(BASE + path, opts);
    const data = await res.json();
    const ok = res.status < 400;
    console.log(`${ok ? "✅" : "❌"} [${res.status}] ${method} ${path} — ${ok ? JSON.stringify(data).slice(0, 120) : data.error}`);
    return { ok, data, status: res.status };
  } catch (e) {
    console.log(`❌ ${method} ${path} — ${e.message}`);
    return { ok: false };
  }
}

// 2. GET /api/v1/listings
await test("GET listings", "GET", "/api/v1/listings?limit=3");

// 3. GET /api/v1/books?isbn
await test("GET books por ISBN", "GET", "/api/v1/books?isbn=9788432209109");

// 4. GET /api/v1/books?title
await test("GET books por título", "GET", "/api/v1/books?title=Borges");

// 5. POST /api/v1/listings — crear listing de prueba
const created = await test("POST listing", "POST", "/api/v1/listings", {
  title: "Libro de prueba API",
  author: "Test Author",
  price: 5000,
  condition: "good",
  modality: "sale"
});

let testListingId = created.data?.listing?.id;

if (testListingId) {
  // 6. PATCH — actualizar precio
  await test("PATCH precio", "PATCH", `/api/v1/listings/${testListingId}`, { price: 7000 });

  // 7. DELETE — dar de baja
  await test("DELETE listing", "DELETE", `/api/v1/listings/${testListingId}`);
}

// 8. Test sin key — debe dar 401
const res401 = await fetch(BASE + "/api/v1/listings");
console.log(`${res401.status === 401 ? "✅" : "❌"} [${res401.status}] Sin key → debe ser 401`);

// Limpiar key de prueba
await supabase.from("api_keys").delete().eq("key", TEST_KEY);

// Limpiar cualquier libro/listing de prueba que haya quedado huérfano (fallback)
const { data: testBooks } = await supabase.from("books").select("id").ilike("title", "%prueba api%");
if (testBooks?.length) {
  const ids = testBooks.map(b => b.id);
  await supabase.from("listings").delete().in("book_id", ids);
  await supabase.from("books").delete().in("id", ids);
}

console.log("\n✅ Key de prueba eliminada. Tests completados.");
