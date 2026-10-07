import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ui/ProfileForm";
import MercadoPagoConnect from "@/components/ui/MercadoPagoConnect";
import ApiKeyManager from "@/components/ui/ApiKeyManager";
import ChangePasswordForm from "@/components/ui/ChangePasswordForm";
import LinkedAccounts from "@/components/ui/LinkedAccounts";
import DeleteAccount from "@/components/ui/DeleteAccount";
import DownloadMyData from "@/components/ui/DownloadMyData";
import DespachoVendedor from "@/components/ui/DespachoVendedor";
import { obtenerTarifasCoordinado } from "@/lib/shipping/coordinado";
import { leerPerfilDespachoConEstado } from "@/lib/shipping/perfilDespacho";

export const metadata = { title: "Mi Perfil — tuslibros.cl", robots: { index: false } };

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/perfil");
  }

  // El perfil propio se lee con service role y acotado a user.id: correo,
  // dirección y coordenadas no se conceden a authenticated (20260923e).
  const { data: profile } = await createServiceRoleClient()
    .from("users")
    .select("full_name, username, email, phone, bio, avatar_url, public_email, instagram, default_latitude, default_longitude, default_address, pickup_points, mercadopago_user_id, mercadopago_connected_at, shipit_dispatch_mode")
    .eq("id", user.id)
    .single();

  const { count: listingsCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", user.id)
    .in("status", ["active", "paused"]);

  // Perfil de despacho (07-10-2026): columnas solo para service role. Si la
  // migración 20261007b no está aplicada, `disponible` es false y la tarjeta
  // no se muestra: no tendría dónde guardar.
  const admin = createServiceRoleClient();
  const [{ perfil: perfilDespacho, disponible: despachoDisponible }, tarifasSitio] = await Promise.all([
    leerPerfilDespachoConEstado(admin, user.id),
    obtenerTarifasCoordinado(admin),
  ]);
  const esVendedor = (listingsCount ?? 0) > 0 || !!profile?.mercadopago_user_id;

  const missingPhone = !profile?.phone;
  const missingAddress = profile?.default_latitude == null || profile?.default_longitude == null;
  const incomplete = missingPhone || missingAddress;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
          <p className="text-sm text-gray-500 mt-1">
            Actualiza tus datos de contacto y ubicación.
          </p>
        </div>
        {incomplete && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
            <p className="font-semibold text-amber-900 mb-1">
              Completa tu perfil para publicar y comprar
            </p>
            <ul className="text-amber-800 space-y-0.5 mt-2">
              {missingPhone && (
                <li>• <strong>Teléfono</strong> — necesario para coordinar con vendedores y compradores</li>
              )}
              {missingAddress && (
                <li>• <strong>Dirección / ubicación</strong> — para cercanía y cotización de envíos</li>
              )}
            </ul>
          </div>
        )}
        <ProfileForm
          userId={user.id}
          initialFullName={profile?.full_name ?? ""}
          initialUsername={profile?.username ?? ""}
          initialPhone={profile?.phone ?? ""}
          initialBio={profile?.bio ?? ""}
          initialAvatarUrl={profile?.avatar_url ?? null}
          initialPublicEmail={profile?.public_email ?? ""}
          initialInstagram={profile?.instagram ?? ""}
          email={profile?.email ?? user.email ?? ""}
          defaultLat={profile?.default_latitude ?? null}
          defaultLng={profile?.default_longitude ?? null}
          defaultAddress={profile?.default_address ?? null}
          initialPickupPoints={(profile?.pickup_points as { label: string; comuna?: string | null }[]) ?? []}
          initialDispatchMode={profile?.shipit_dispatch_mode ?? null}
        />
        {despachoDisponible && esVendedor && (
          <div className="mt-4">
            <DespachoVendedor
              inicial={perfilDespacho}
              tarifasSitio={
                tarifasSitio
                  ? {
                      santiago: tarifasSitio.santiago,
                      misma_region: tarifasSitio.misma_region,
                      otra_region: tarifasSitio.otra_region,
                      extremos: tarifasSitio.extremos,
                    }
                  : null
              }
            />
          </div>
        )}
        <div className="mt-4">
          <MercadoPagoConnect
            isConnected={!!profile?.mercadopago_user_id}
            connectedAt={profile?.mercadopago_connected_at ?? null}
          />
        </div>
        <LinkedAccounts />
        <ApiKeyManager />
        <ChangePasswordForm />
        <DownloadMyData />
        <DeleteAccount listingsCount={listingsCount ?? 0} />
      </main>
    </div>
  );
}
