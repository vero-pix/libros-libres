"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface Props {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const detectedRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

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

  const toggleTorch = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner || !hasTorch) return;

    try {
      const nextState = !isTorchOn;
      // applyVideoConstraints is the standard way to toggle torch in html5-qrcode
      await scanner.applyVideoConstraints({
        //@ts-ignore - torch is not in standard types but supported by browsers
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.error("Failed to toggle torch:", err);
    }
  }, [hasTorch, isTorchOn]);

  useEffect(() => {
    const id = "barcode-reader";
    const scanner = new Html5Qrcode(id, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
      ],
      verbose: false,
    });
    scannerRef.current = scanner;

    // Use a more generous scan area (square-ish but not full height)
    const screenW = window.innerWidth;
    const boxW = Math.min(screenW - 60, 320);
    const boxH = Math.round(boxW * 0.65); // More height for easier focus/alignment

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 20, // Increased for smoother detection
          qrbox: { width: boxW, height: boxH },
          aspectRatio: 1.0, // Square aspect ratio for the camera feed helps focus
          disableFlip: true,
        },
        (decodedText) => {
          if (detectedRef.current) return;
          // Validar que sea un ISBN (10 o 13 dígitos). Ignorar códigos cortos o de otros tipos.
          if (!/^\d{10}(\d{3})?$/.test(decodedText)) return;
          
          detectedRef.current = true;
          setIsFlashing(true); // Visual feedback

          // Vibrate on detection (mobile)
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          
          setTimeout(() => {
            stop().then(() => onDetected(decodedText));
          }, 300);
        },
        () => {
          // ignore scan failures
        }
      )
      .then(() => {
        // Check if torch is available
        try {
          const track = scanner.getRunningTrackCapabilities();
          //@ts-ignore
          if (track && track.torch) {
            setHasTorch(true);
          }
        } catch {
          // track capabilities not supported
        }
      })
      .catch((err) => {
        console.error("Scanner start error:", err);
        setCameraError("No pudimos acceder a la cámara. Revisa los permisos.");
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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-md text-white border-b border-white/10">
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight">Lector de Libros</span>
          <span className="text-[10px] text-white/60 uppercase tracking-widest font-medium">Apunta al código de barras</span>
        </div>
        <button
          type="button"
          onClick={() => { stop(); onClose(); }}
          className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Cerrar escáner"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative overflow-hidden bg-zinc-900" ref={containerRef}>
        <div id="barcode-reader" className="absolute inset-0 w-full h-full [&>video]:!object-cover [&>video]:!w-full [&>video]:!h-full" />

        {/* Detection Flash Overlay */}
        {isFlashing && (
          <div className="absolute inset-0 z-10 bg-white animate-out fade-out duration-300 pointer-events-none" />
        )}

        {/* Camera Error Message */}
        {cameraError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center px-8 text-center bg-black/80">
            <div className="space-y-4">
              <div className="text-4xl">📷</div>
              <p className="text-white font-medium">{cameraError}</p>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-brand-500 text-white rounded-xl text-sm font-bold"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        {/* Visor de encuadre */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="relative transition-all duration-500" 
            style={{ 
              width: Math.min(window?.innerWidth - 60 || 280, 320), 
              height: Math.round(Math.min(window?.innerWidth - 60 || 280, 320) * 0.65) 
            }}
          >
            {/* Línea de escaneo animada */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl ring-2 ring-white/20">
              <div className="absolute left-0 right-0 h-1 bg-brand-400 shadow-[0_0_15px_rgba(212,160,23,0.8)] opacity-80 animate-scan" />
            </div>
            
            {/* Esquinas del visor - Estilo Premium */}
            <span className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-brand-500 rounded-tl-xl shadow-lg" />
            <span className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-brand-500 rounded-tr-xl shadow-lg" />
            <span className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-brand-500 rounded-bl-xl shadow-lg" />
            <span className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-brand-500 rounded-br-xl shadow-lg" />
          </div>
        </div>
      </div>

      {/* Toolbar Inferior */}
      <div className="px-6 py-8 bg-black/40 backdrop-blur-md flex flex-col items-center gap-6">
        <div className="flex items-center gap-8">
          {/* Botón de Linterna */}
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`w-14 h-14 flex items-center justify-center rounded-full transition-all border-2 ${
                isTorchOn 
                  ? "bg-brand-500 border-brand-400 text-white shadow-[0_0_20px_rgba(212,160,23,0.4)]" 
                  : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isTorchOn ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 2 1 6H5l9 14-1-6h5L9 2z"></path>
              </svg>
            </button>
          )}
        </div>
        
        <p className="text-white/40 text-[11px] font-medium uppercase tracking-widest text-center max-w-[200px]">
          Ubica el código de barras dentro del recuadro
        </p>
      </div>
    </div>
  );
}
