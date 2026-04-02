import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import PublishForm from "@/components/listings/PublishForm";

export default async function PublishPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/publish");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("phone, default_latitude, default_longitude, default_address")
    .eq("id", user.id)
    .single();

  const defaultLocation =
    profile?.default_latitude != null && profile?.default_longitude != null
      ? {
          lat: profile.default_latitude as number,
          lng: profile.default_longitude as number,
          address: (profile.default_address as string | null) ?? "",
        }
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Publicar libro</h1>
          <p className="text-sm text-gray-500 mt-1">
            Completa los datos para poner tu libro disponible en el mapa.
          </p>
        </div>
        <PublishForm
          userId={user.id}
          existingPhone={profile?.phone ?? null}
          defaultLocation={defaultLocation}
        />
      </main>
    </div>
  );
}
