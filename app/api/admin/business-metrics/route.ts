import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Cache in-memory del resultado. El tab Negocio es admin, baja frecuencia,
// no necesita datos al segundo. Evita quemar CPU con 5 queries pesadas.
let cachedResponse: { payload: unknown; expiresAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (cachedResponse && cachedResponse.expiresAt > Date.now()) {
    return NextResponse.json(cachedResponse.payload);
  }

  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();

  const [
    { data: views30 },
    { count: registered },
    { data: ordersAll },
    { data: carts },
    { data: allListings },
  ] = await Promise.all([
    supabase.from("page_views").select("session_id").gte("created_at", since30),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id, status, total_amount, buyer_id, created_at, buyer:users!buyer_id(full_name, email)").order("created_at", { ascending: false }),
    supabase.from("cart_items").select("id, added_at, listing:listings(price, book:books(title)), user:users(full_name, email)").order("added_at", { ascending: false }),
    supabase.from("listings").select("seller_id, status, seller:users(full_name, username)"),
  ]);

  const uniqueSessions30d = new Set((views30 ?? []).map((v: any) => v.session_id).filter(Boolean)).size;
  const allOrders = ordersAll ?? [];
  const paidStatuses = ["paid", "shipped", "delivered", "completed"];
  const paidOrders = allOrders.filter((o: any) => paidStatuses.includes(o.status));
  const pendingOrders = allOrders.filter((o: any) => o.status === "pending");
  const failedOrders = allOrders.filter((o: any) => ["rejected", "cancelled", "refunded"].includes(o.status));

  const buyersWithOrder = new Set(allOrders.map((o: any) => o.buyer_id));
  const buyersWithPaid = new Set(paidOrders.map((o: any) => o.buyer_id));

  const totalPaid = paidOrders.reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0);

  const funnel = {
    visitors30d: uniqueSessions30d,
    registered: registered ?? 0,
    withOrder: buyersWithOrder.size,
    withPaidOrder: buyersWithPaid.size,
    regConv: uniqueSessions30d > 0 ? ((registered ?? 0) / uniqueSessions30d) * 100 : 0,
    orderConv: (registered ?? 0) > 0 ? (buyersWithOrder.size / (registered ?? 1)) * 100 : 0,
    payConv: buyersWithOrder.size > 0 ? (buyersWithPaid.size / buyersWithOrder.size) * 100 : 0,
  };

  // Carritos abandonados: cart_items con > 1 día
  const cartItems = (carts ?? []).map((c: any) => ({
    id: c.id,
    daysOld: Math.floor((Date.now() - new Date(c.added_at).getTime()) / 864e5),
    buyer: c.user?.full_name ?? "?",
    email: c.user?.email ?? "?",
    title: c.listing?.book?.title ?? "?",
    price: c.listing?.price ?? 0,
  }));
  const uniqueBuyers = new Set(cartItems.map((c) => c.email)).size;
  const totalValue = cartItems.reduce((s, c) => s + (c.price ?? 0), 0);

  // Pendientes (con buyer)
  const pendingList = pendingOrders.map((o: any) => ({
    id: o.id,
    daysOld: Math.floor((Date.now() - new Date(o.created_at).getTime()) / 864e5),
    buyer: o.buyer?.full_name ?? "?",
    email: o.buyer?.email ?? "?",
    total: o.total_amount ?? 0,
  }));

  // Top sellers
  const sellerMap: Record<string, { name: string; username: string | null; listings: number; sold: number }> = {};
  for (const l of allListings ?? []) {
    const id = (l as any).seller_id;
    if (!sellerMap[id]) sellerMap[id] = { name: (l as any).seller?.full_name ?? "?", username: (l as any).seller?.username ?? null, listings: 0, sold: 0 };
    if ((l as any).status === "active") sellerMap[id].listings++;
    if ((l as any).status === "completed") sellerMap[id].sold++;
  }
  const topSellers = Object.values(sellerMap).sort((a, b) => (b.listings + b.sold * 3) - (a.listings + a.sold * 3)).slice(0, 8);

  const payload = {
    funnel,
    revenue: {
      totalPaid,
      totalOrders: allOrders.length,
      paidOrders: paidOrders.length,
      pendingOrders: pendingOrders.length,
      failedOrders: failedOrders.length,
    },
    abandonedCarts: { total: cartItems.length, uniqueBuyers, totalValue, items: cartItems },
    pendingOrders: pendingList,
    topSellers,
  };
  cachedResponse = { payload, expiresAt: Date.now() + CACHE_TTL_MS };
  return NextResponse.json(payload);
}
