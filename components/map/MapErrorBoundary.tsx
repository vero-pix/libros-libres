"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("[Map] Render crashed, mostrando fallback:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="w-full h-full min-h-[320px] flex items-center justify-center bg-cream-warm border border-cream-dark rounded-md p-6">
            <div className="text-center max-w-md">
              <p className="font-display text-lg font-bold text-ink mb-2">
                El mapa no pudo cargar en este navegador
              </p>
              <p className="text-sm text-ink-muted mb-4">
                Tu Chrome tiene la aceleración por hardware (WebGL) desactivada. Actívala
                en <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-cream-dark">chrome://settings/system</span>{" "}
                → &quot;Usar aceleración de hardware&quot;, y reinicia Chrome.
              </p>
              <p className="text-xs text-ink-muted">
                Mientras tanto, puedes seguir navegando en la vista <strong>Grilla</strong>.
              </p>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
