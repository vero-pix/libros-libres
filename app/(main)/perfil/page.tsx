import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ui/ProfileForm";
import MercadoPagoConnect from "@/components/ui/MercadoPagoConnect";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/perfil");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email, phone, default_latitude, default_longitude, default_address, mercadopago_user_id, mercadopago_connected_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
          <p className="text-sm text-gray-500 mt-1">
            Actualiza tus datos de contacto y ubicación.
          </p>
        </div>
        <ProfileForm
          userId={user.id}
          initialFullName={profile?.full_name ?? ""}
          initialPhone={profile?.phone ?? ""}
          email={profile?.email ?? user.email ?? ""}
          defaultLat={profile?.default_latitude ?? null}
          defaultLng={profile?.default_longitude ?? null}
          defaultAddress={profile?.default_address ?? null}
        />
        <div className="mt-4">
          <MercadoPagoConnect
            isConnected={!!profile?.mercadopago_user_id}
            connectedAt={profile?.mercadopago_connected_at ?? null}
          />
        </div>
      </main>
    </div>
  );
}
