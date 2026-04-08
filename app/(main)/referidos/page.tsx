import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReferralDashboard from "@/components/referrals/ReferralDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invita y gana — tuslibros.cl",
  description: "Invita amigos a tuslibros.cl y gana descuentos en despacho.",
  alternates: { canonical: "https://tuslibros.cl/referidos" },
};

export default async function ReferidosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/referidos");

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invita y gana</h1>
        <p className="text-ink-muted mb-8">
          Invita vendedores a tuslibros.cl. Cuando publiquen su primer libro, ganas un descuento en tu próximo despacho.
        </p>
        <ReferralDashboard />
      </main>
    </div>
  );
}
