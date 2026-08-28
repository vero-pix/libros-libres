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
  // Supabase corta en 1.000 filas: el panel contaba las publicaciones activas
  // sobre esa primera página y mostraba 906 cuando el catálogo tenía 2.115.
  // Un número inventado en el panel es peor que no tenerlo: se toman decisiones
  // con él. Ver [[reference_supabase_techo_1000_filas]]. (28-08-2026)
  async function listingsTodos(db: typeof supabase) {
    const filas: any[] = [];
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await db
        .from("listings")
        .select(`*, book:books(*), seller:users(id, full_name, email, phone)`)
        .order("created_at", { ascending: false })
        .range(desde, desde + 999);
      if (error) return { data: filas, error };
      filas.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    return { data: filas, error: null };
  }

  const [ordersRes, listingsRes, usersRes, messagesRes, subscribersRes, categoriesRes, requestsRes] = await Promise.all([
    supabase
      .from("orders")
      .select(`
        *,
        listing:listings(*, book:books(*), seller:users(id, full_name, email, phone)),
        buyer:users!orders_buyer_id_fkey(id, full_name, email, phone)
      `)
      .order("created_at", { ascending: false }),
    listingsTodos(supabase),
    supabase
      // Columnas explícitas, NO select("*"): el permiso sobre users es por
      // columna desde 20260727_fix_revoke_tokens_mp.sql. Ver /vendedor/[id].
      .from("users")
      .select(
        "id, email, full_name, avatar_url, created_at, updated_at, city, phone, default_address, role, mercadopago_user_id, mercadopago_connected_at, plan, bio, public_email, instagram, referral_code, referred_by, featured, username, on_vacation, vacation_message",
      )
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
