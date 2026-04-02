"use client";

import React, { useEffect, useRef } from "react";
import { useZxing } from "react-zxing";

interface Props {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const detectedRef = useRef(false);

  const { ref } = useZxing({
    onDecodeResult(result) {
      if (detectedRef.current) return;
      const text = result.getText();
      // Aceptar solo EAN-13 con largo 13 (ISBNs modernos) o EAN-10
      if (!/^\d{10}(\d{3})?$/.test(text)) return;
      detectedRef.current = true;
      onDetected(text);
    },
    constraints: {
      video: {
        facingMode: "environment", // cámara trasera en móvil
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
  });

  // Cerrar con Escape en desktop
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 text-white">
        <span className="text-sm font-medium">Apunta al código de barras del libro</span>
        <button
          type="button"
          onClick={onClose}
          className="text-white/70 hover:text-white text-2xl leading-none px-2"
          aria-label="Cerrar escáner"
        >
          ✕
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={ref as React.RefObject<HTMLVideoElement>}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Visor de encuadre */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-72 h-32">
            {/* Línea de escaneo animada */}
            <div className="absolute inset-0 overflow-hidden rounded">
              <div className="absolute left-0 right-0 h-0.5 bg-brand-400 opacity-80 animate-scan" />
            </div>
            {/* Esquinas del visor */}
            <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl" />
            <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr" />
            <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl" />
            <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br" />
          </div>
        </div>
      </div>

      {/* Hint inferior */}
      <div className="px-4 py-4 bg-black/80 text-center">
        <p className="text-white/60 text-xs">
          Mantén el código de barras dentro del recuadro
        </p>
      </div>
    </div>
  );
}
