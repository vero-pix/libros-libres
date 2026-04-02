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
        <PublishForm userId={user.id} />
      </main>
    </div>
  );
}
