import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "tuslibros.cl — los libros que ya leíste y los que te faltan";
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
          background: "linear-gradient(135deg, #faf7f2 0%, #f5e5c0 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div style={{ fontSize: 84, display: "flex", fontWeight: 700 }}>
            <span style={{ color: "#2a1f14" }}>tuslibros</span>
            <span style={{ color: "#a8581e" }}>.cl</span>
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#3a2f24",
              maxWidth: 820,
              textAlign: "center",
              lineHeight: 1.35,
              fontStyle: "italic",
            }}
          >
            Los libros que ya leíste y los que te faltan.
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#7a6649",
              maxWidth: 760,
              textAlign: "center",
              lineHeight: 1.45,
              marginTop: "6px",
            }}
          >
            Compra, vende y arrienda libros en Chile. Pago seguro con MercadoPago.
            Despacho puerta a puerta con Shipit o retiro en mano.
          </div>
          <div
            style={{
              marginTop: "34px",
              fontSize: 18,
              color: "#a8581e",
              letterSpacing: "4px",
              textTransform: "uppercase",
              fontWeight: 600,
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
