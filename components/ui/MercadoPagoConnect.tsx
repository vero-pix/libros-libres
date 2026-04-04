"use client";

import { useSearchParams } from "next/navigation";

interface Props {
  isConnected: boolean;
  connectedAt: string | null;
}

export default function MercadoPagoConnect({ isConnected, connectedAt }: Props) {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("mp_connected") === "true";
  const mpError = searchParams.get("mp_error");

  const connected = isConnected || justConnected;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">MercadoPago</h2>
        <p className="text-xs text-gray-400 mt-1">
          Conecta tu cuenta para recibir pagos de ventas y arriendos.
        </p>
      </div>
      <div className="px-6 py-5 space-y-3">
        {connected ? (
          <>
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-green-600 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Cuenta conectada</p>
                {connectedAt && (
                  <p className="text-xs text-green-600">
                    Desde {new Date(connectedAt).toLocaleDateString("es-CL")}
                  </p>
                )}
              </div>
            </div>
            <a
              href="/api/auth/mercadopago"
              className="block w-full text-center py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Reconectar cuenta
            </a>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              Para vender o arrendar libros necesitas conectar tu cuenta de MercadoPago.
              El dinero de tus ventas llegará directamente a tu cuenta.
            </p>
            <a
              href="/api/auth/mercadopago"
              className="block w-full text-center py-3 bg-[#009ee3] hover:bg-[#007eb5] text-white font-semibold rounded-2xl transition-colors"
            >
              Conectar MercadoPago
            </a>
          </>
        )}

        {mpError && (
          <p className="text-xs text-red-600">
            Error al conectar MercadoPago
            {mpError === "token_exchange" && ": no se pudo obtener el token. Intenta de nuevo."}
            {mpError === "save_failed" && ": error al guardar. Intenta de nuevo."}
            {mpError === "missing_params" && ": respuesta incompleta de MercadoPago."}
          </p>
        )}
      </div>
    </div>
  );
}
