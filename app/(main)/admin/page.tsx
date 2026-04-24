import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "./AdminDashboard";

export const metadata = { title: "Admin — tuslibros.cl" };

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify admin role (middleware also checks, but double-check)
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  // Load all data for admin
  const [ordersRes, listingsRes, usersRes, messagesRes, subscribersRes, categoriesRes, requestsRes] = await Promise.all([
    supabase
      .from("orders")
      .select(`
        *,
        listing:listings(*, book:books(*)),
        buyer:users!orders_buyer_id_fkey(id, full_name, email, phone)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("listings")
      .select(`*, book:books(*), seller:users(id, full_name, email, phone)`)
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false })
      .limit(100),
    supabase
      .from("categories")
      .select("slug, name, parent_slug, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("book_requests")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel de Administración</h1>
        <AdminDashboard
          orders={ordersRes.data ?? []}
          listings={listingsRes.data ?? []}
          users={usersRes.data ?? []}
          messages={messagesRes.data ?? []}
          subscribers={subscribersRes.data ?? []}
          categories={categoriesRes.data ?? []}
          bookRequests={requestsRes.data ?? []}
        />
      </main>
    </div>
  );
}
