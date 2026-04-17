import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const c = fs.readFileSync(envPath, "utf-8");
for (const line of c.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SELLER_ID = "2201d163-4423-4971-91f0-f6cebd00d1bd";

async function uploadAndUpdate(slug, localFile) {
  const buf = fs.readFileSync(localFile);
  const destName = `${slug}-fixed-${Date.now()}.jpg`;
  const storagePath = `${SELLER_ID}/${destName}`;
  const { error } = await s.storage.from("covers").upload(storagePath, buf, { upsert: true, contentType: "image/jpeg" });
  if (error) throw error;
  const url = s.storage.from("covers").getPublicUrl(storagePath).data.publicUrl;
  const { data, error: updErr } = await s
    .from("listings")
    .update({ cover_image_url: url })
    .eq("slug", slug)
    .eq("seller_id", SELLER_ID)
    .select("id, slug, cover_image_url");
  if (updErr) throw updErr;
  console.log(`✓ ${slug}: ${url}`);
  return data;
}

await uploadAndUpdate("un-ano", "/tmp/book_covers/emar_unanio_v3.jpg");
await uploadAndUpdate("ayer", "/tmp/book_covers/emar_ayer_v3.jpg");
console.log("\n✅ Emar covers corregidas");
