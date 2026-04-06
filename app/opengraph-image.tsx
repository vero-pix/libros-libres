import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Libros Libres — Donde los libros encuentran nuevos lectores";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #faf8f4 0%, #f5f0e8 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ fontSize: 72, display: "flex" }}>
            <span style={{ fontWeight: 700, color: "#1a1a2e" }}>Libros </span>
            <span style={{ fontWeight: 700, color: "#d4a017" }}>Libres</span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#6b6b7b",
              maxWidth: 600,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Compra, vende y arrienda libros cerca de ti. Pago seguro con MercadoPago.
          </div>
          <div
            style={{
              display: "flex",
              gap: "40px",
              marginTop: "24px",
              fontSize: 20,
              color: "#6b6b7b",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: "#d4a017" }}>500+</span>
              <span>libros</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: "#d4a017" }}>150+</span>
              <span>vendedores</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: "#d4a017" }}>100%</span>
              <span>seguro</span>
            </div>
          </div>
          <div
            style={{
              marginTop: "20px",
              fontSize: 18,
              color: "#d4a017",
              fontStyle: "italic",
            }}
          >
            tuslibros.cl
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
