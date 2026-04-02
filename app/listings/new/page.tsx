import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewListingForm from "@/components/listings/NewListingForm";
import Navbar from "@/components/ui/Navbar";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Publicar libro</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <NewListingForm userId={user.id} />
        </div>
      </main>
    </div>
  );
}
