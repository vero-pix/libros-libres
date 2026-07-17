"use client";

import { useEffect, useState } from "react";
import type { UserIdentity } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type ProviderKey = "google" | "linkedin_oidc";

const PROVIDERS: { key: ProviderKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "google",
    label: "Google",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
        <path d="M3.964 10.705A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.705V4.963H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.037l3.007-2.332z" fill="#FBBC05" />
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.963L3.964 7.295C4.672 5.168 6.656 3.58 9 3.58z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    key: "linkedin_oidc",
    label: "LinkedIn",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="#0077B5" aria-hidden>
        <path d="M16 0H2C0.895 0 0 0.895 0 2v14c0 1.105 0.895 2 2 2h14c1.105 0 2-0.895 2-2V2c0-1.105-0.895-2-2-2zM5.333 15.333H2.667V6.667h2.667v8.666zM4 5.333c-0.854 0-1.547-0.693-1.547-1.547s0.693-1.547 1.547-1.547c0.854 0 1.547 0.693 1.547 1.547S4.854 5.333 4 5.333zM15.333 15.333h-2.667v-4.167c0-0.993-0.02-2.271-1.384-2.271-1.385 0-1.597 1.082-1.597 2.198v4.24h-2.667V6.667h2.56v1.183h0.036c0.356-0.675 1.227-1.386 2.524-1.386 2.7 0 3.2 1.777 3.2 4.088v4.781z" />
      </svg>
    ),
  },
];

export default function LinkedAccounts() {
  const supabase = createClient();
  const [identities, setIdentities] = useState<UserIdentity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ProviderKey | null>(null);

  async function refresh() {
    const { data, error } = await supabase.auth.getUserIdentities();
    if (error) {
      setIdentities([]);
      return;
    }
    setIdentities(data?.identities ?? []);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect(provider: ProviderKey) {
    setBusy(provider);
    setError(null);
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/perfil`,
      },
    });
    // En éxito el navegador redirige al proveedor; si volvemos acá es por error.
    if (error) {
      setBusy(null);
      if (/manual linking/i.test(error.message)) {
        setError(
          "La vinculación manual está deshabilitada en el servidor. Actívala en Supabase → Authentication."
        );
      } else if (/already/i.test(error.message)) {
        setError("Esa cuenta ya está vinculada a otro usuario.");
      } else {
        setError("No se pudo iniciar la vinculación. Intenta de nuevo.");
      }
    }
  }

  async function disconnect(identity: UserIdentity) {
    setBusy(identity.provider as ProviderKey);
    setError(null);
    const { error } = await supabase.auth.unlinkIdentity(identity);
    setBusy(null);
    if (error) {
      setError("No se pudo desconectar la cuenta. Intenta de nuevo.");
      return;
    }
    refresh();
  }

  const linkedCount = identities?.length ?? 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-4">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Cuentas conectadas</h2>
      <p className="text-sm text-gray-500 mb-4">
        Vincula Google o LinkedIn para entrar con un clic, sin contraseña.
      </p>

      {identities === null ? (
        <p className="text-sm text-gray-400">Cargando…</p>
      ) : (
        <div className="space-y-2.5">
          {PROVIDERS.map(({ key, label, icon }) => {
            const identity = identities.find((i) => i.provider === key);
            const connected = !!identity;
            const isBusy = busy === key;
            // No permitir desconectar si es la única forma de entrar.
            const canDisconnect = connected && linkedCount > 1;

            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 py-2.5 px-3 border border-gray-200 rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {icon}
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                  {connected && (
                    <span className="text-xs text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Conectada
                    </span>
                  )}
                </div>

                {connected ? (
                  <button
                    type="button"
                    onClick={() => identity && disconnect(identity)}
                    disabled={isBusy || !canDisconnect}
                    title={
                      canDisconnect
                        ? undefined
                        : "No puedes desconectar tu única forma de acceso."
                    }
                    className="text-xs font-medium text-gray-500 hover:text-red-600 disabled:opacity-40 disabled:hover:text-gray-500 whitespace-nowrap"
                  >
                    {isBusy ? "…" : "Desconectar"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => connect(key)}
                    disabled={isBusy}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isBusy ? "Redirigiendo…" : "Conectar"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}
    </div>
  );
}
