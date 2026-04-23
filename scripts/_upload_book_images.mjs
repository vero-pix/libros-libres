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
const VERO_ID = "2201d163-4423-4971-91f0-f6cebd00d1bd";

// Schema listing_images
const { data: liSample } = await s.from("listing_images").select("*").limit(1);
console.log("listing_images columns:", Object.keys(liSample?.[0]||{}));

async function uploadFile(localPath, storagePath) {
  const buf = fs.readFileSync(localPath);
  const { data, error } = await s.storage.from("covers").upload(storagePath, buf, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: true,
  });
  if (error) { console.error(`upload err ${storagePath}:`, error.message); return null; }
  const { data: pub } = s.storage.from("covers").getPublicUrl(storagePath);
  return pub.publicUrl;
}

async function setCover(listingSlug, coverUrl) {
  const { data: listing } = await s.from("listings").select("id").eq("slug", listingSlug).eq("seller_id", VERO_ID).single();
  if (!listing) { console.error(`listing not found: ${listingSlug}`); return null; }
  const { error } = await s.from("listings").update({ cover_image_url: coverUrl }).eq("id", listing.id);
  if (error) console.error("update cover err:", error);
  return listing.id;
}

async function addExtraImage(listingId, imageUrl, order) {
  const { error } = await s.from("listing_images").insert({
    listing_id: listingId,
    image_url: imageUrl,
    sort_order: order,
  });
  if (error) console.error("listing_images err:", error);
}

const stamp = Date.now();

// Subir todos los JPGs una vez (se reutilizan entre listings)
const urls = {};
for (const id of ["9003","9004","9005","9006","9007","9008"]) {
  const url = await uploadFile(`/tmp/seneca/IMG_${id}.jpg`, `${VERO_ID}/${stamp}-${id}.jpg`);
  if (url) { urls[id] = url; console.log(`↑ IMG_${id} → ${url.slice(-60)}`); }
}

// SÉNECA TOMO I
const seneca1 = await setCover("obras-escogidas-de-seneca-tomo-i", urls["9007"]);
console.log(`✓ Séneca I cover set`);
await addExtraImage(seneca1, urls["9008"], 1);
await addExtraImage(seneca1, urls["9005"], 2);

// SÉNECA TOMO II
const seneca2 = await setCover("obras-escogidas-de-seneca-tomo-ii", urls["9006"]);
console.log(`✓ Séneca II cover set`);
await addExtraImage(seneca2, urls["9008"], 1);
await addExtraImage(seneca2, urls["9005"], 2);
await addExtraImage(seneca2, urls["9004"], 3);

// PLUTARCO T1 y T2 — misma foto de portadillas para ambos
const plut1 = await setCover("las-vidas-paralelas-de-plutarco-tomo-i", urls["9003"]);
const plut2 = await setCover("las-vidas-paralelas-de-plutarco-tomo-ii", urls["9003"]);
console.log(`✓ Plutarco I y II cover set (misma foto de ambos tomos)`);
