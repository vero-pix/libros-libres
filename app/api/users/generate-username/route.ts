import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
}

export async function POST(req: NextRequest) {
  try {
    const { userId, fullName } = await req.json();
    if (!userId || !fullName) {
      return NextResponse.json({ error: "missing userId or fullName" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const base = slugifyName(fullName);
    if (!base) {
      return NextResponse.json({ ok: true, username: null });
    }

    // Si ya tiene username, no lo tocamos: reasignarlo rompe su URL pública.
    const { data: actual } = await supabase
      .from("users")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    if (actual?.username) {
      return NextResponse.json({ ok: true, username: actual.username });
    }

    // Find first available username: base, base2, base3...
    // Ojo con el .neq: sin él, un segundo llamado para el mismo usuario ve el
    // username que él mismo acaba de tomar, lo cree ocupado y salta a "base2".
    let candidate = base;
    let suffix = 2;
    while (true) {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("username", candidate)
        .neq("id", userId)
        .maybeSingle();

      if (!data) break;
      candidate = `${base}${suffix}`;
      suffix++;
      if (suffix > 99) {
        // Fallback: just skip, UUID will be used
        return NextResponse.json({ ok: true, username: null });
      }
    }

    await supabase
      .from("users")
      .update({ username: candidate })
      .eq("id", userId);

    return NextResponse.json({ ok: true, username: candidate });
  } catch (e: any) {
    console.error("[generate-username]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
