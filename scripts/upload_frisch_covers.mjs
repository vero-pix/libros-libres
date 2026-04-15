import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = "9bee4b1a-65b4-4f36-a94a-2705380dcabf";

const items = [
  {
    isbn: "8432200301",
    listingId: "fe66d4d2-8510-48ee-993e-8a5dc391a275",
    local: "/tmp/stiller_cover.jpg",
    destName: `stiller-${Date.now()}.jpg`,
  },
  {
    isbn: "843220420X",
    listingId: "3b68acfc-b4c2-436f-bbef-52f23352512c",
    local: "/tmp/gantenbein_cover.jpg",
    destName: `gantenbein-${Date.now()}.jpg`,
  },
];

for (const it of items) {
  const buf = fs.readFileSync(it.local);
  const path = `${USER_ID}/${it.destName}`;
  const { error: upErr } = await s.storage.from("covers").upload(path, buf, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (upErr) throw upErr;
  const { data: { publicUrl } } = s.storage.from("covers").getPublicUrl(path);
  console.log(it.isbn, "→", publicUrl);

  const { error: bErr } = await s.from("books").update({ cover_url: publicUrl }).eq("isbn", it.isbn);
  if (bErr) throw bErr;
  const { error: lErr } = await s.from("listings").update({ cover_image_url: publicUrl }).eq("id", it.listingId);
  if (lErr) throw lErr;
}
console.log("✅ Portadas actualizadas.");
