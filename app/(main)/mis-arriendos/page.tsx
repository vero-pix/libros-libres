import { redirect } from "next/navigation";

// El arriendo se descontinuó el 24-07-2026 y "Mis arriendos" se sacó del menú
// el 20-07. Desde el 04-10-2026 la página tampoco existe: quien llegue por un
// enlace viejo cae en sus compras.
export default function MisArriendosPage() {
  redirect("/mis-pedidos");
}
