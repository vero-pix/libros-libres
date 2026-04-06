import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          borderRadius: "36px",
        }}
      >
        <div style={{ fontSize: 80, color: "white", fontWeight: 800, fontFamily: "Georgia, serif" }}>
          LL
        </div>
      </div>
    ),
    { ...size }
  );
}
