"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface Props {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const detectedRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stop = useCallback(async () => {
    try {
      const s = scannerRef.current;
      if (s) {
        scannerRef.current = null;
        if (s.isScanning) await s.stop();
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const id = "barcode-reader";
    const scanner = new Html5Qrcode(id, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
      ],
      verbose: false,
    });
    scannerRef.current = scanner;

    // Use wider scan area for better detection on large screens
    const screenW = window.innerWidth;
    const boxW = Math.min(screenW - 48, 340);
    const boxH = Math.round(boxW * 0.44);

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: boxW, height: boxH },
          aspectRatio: 1.777,
          disableFlip: true,
        },
        (decodedText) => {
          if (detectedRef.current) return;
          if (!/^\d{10}(\d{3})?$/.test(decodedText)) return;
          detectedRef.current = true;
          // Vibrate on detection (mobile)
          if (navigator.vibrate) navigator.vibrate(100);
          stop().then(() => onDetected(decodedText));
        },
        () => {
          // ignore scan failures
        }
      )
      .catch(() => {
        // camera permission denied or not available
      });

    return () => {
      stop();
    };
  }, [onDetected, stop]);

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
          onClick={() => { stop(); onClose(); }}
          className="text-white/70 hover:text-white text-2xl leading-none px-2"
          aria-label="Cerrar escáner"
        >
          ✕
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        <div id="barcode-reader" className="absolute inset-0 w-full h-full [&>video]:!object-cover [&>video]:!w-full [&>video]:!h-full" />

        {/* Visor de encuadre */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative" style={{ width: Math.min(window?.innerWidth - 48 || 288, 340), height: Math.round(Math.min(window?.innerWidth - 48 || 288, 340) * 0.44) }}>
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
          Acerca el código de barras al centro del recuadro
        </p>
      </div>
    </div>
  );
}
