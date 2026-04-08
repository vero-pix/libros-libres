import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateCode(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 4);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base || "LIBRO"}-${rand}`;
}

/** GET /api/referrals — get current user's referral code and stats */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Get or create referral code
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, referral_code")
    .eq("id", user.id)
    .single();

  let code = profile?.referral_code;

  if (!code) {
    code = generateCode(profile?.full_name ?? "");
    // Try to set it, regenerate if collision
    for (let i = 0; i < 3; i++) {
      const { error } = await supabase
        .from("users")
        .update({ referral_code: code })
        .eq("id", user.id);
      if (!error) break;
      code = generateCode(profile?.full_name ?? "");
    }
  }

  // Get referral stats
  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, status, completed_at")
    .eq("referrer_id", user.id);

  const stats = {
    code,
    link: `https://tuslibros.cl/registro?ref=${code}`,
    total: referrals?.length ?? 0,
    completed: referrals?.filter((r) => r.status === "completed" || r.status === "rewarded").length ?? 0,
    rewarded: referrals?.filter((r) => r.status === "rewarded").length ?? 0,
  };

  return NextResponse.json(stats);
}

/** POST /api/referrals — register that a referred user signed up */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { referral_code } = await req.json();
  if (!referral_code) return NextResponse.json({ error: "Código requerido" }, { status: 400 });

  // Find referrer by code
  const { data: referrer } = await supabase
    .from("users")
    .select("id")
    .eq("referral_code", referral_code)
    .single();

  if (!referrer) return NextResponse.json({ error: "Código inválido" }, { status: 404 });
  if (referrer.id === user.id) return NextResponse.json({ error: "No puedes usar tu propio código" }, { status: 400 });

  // Check if already referred
  const { data: existingRef } = await supabase
    .from("users")
    .select("referred_by")
    .eq("id", user.id)
    .single();

  if (existingRef?.referred_by) {
    return NextResponse.json({ error: "Ya usaste un código de referido" }, { status: 400 });
  }

  // Mark user as referred
  await supabase
    .from("users")
    .update({ referred_by: referrer.id })
    .eq("id", user.id);

  // Create referral record
  await supabase.from("referrals").insert({
    referrer_id: referrer.id,
    referral_code: referral_code,
    referred_id: user.id,
    status: "completed",
    completed_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, message: "Referido registrado" });
}
