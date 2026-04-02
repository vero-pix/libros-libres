import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import ProfileForm from "@/components/ui/ProfileForm";

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
    .select("full_name, email, phone, city")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
          <p className="text-sm text-gray-500 mt-1">
            Actualiza tus datos de contacto.
          </p>
        </div>
        <ProfileForm
          userId={user.id}
          initialFullName={profile?.full_name ?? ""}
          initialPhone={profile?.phone ?? ""}
          email={profile?.email ?? user.email ?? ""}
        />
      </main>
    </div>
  );
}
