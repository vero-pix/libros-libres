import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #d4a017, #b8860b)",
          borderRadius: "96px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 200, color: "white", fontWeight: 800, fontFamily: "Georgia, serif", lineHeight: 1 }}>
            LL
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
