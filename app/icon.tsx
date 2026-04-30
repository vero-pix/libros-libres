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
          background: "#1f2a44",
          borderRadius: "128px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 240, color: "white", fontWeight: 700, fontFamily: "serif" }}>
            T
          </div>
          <div style={{ fontSize: 240, color: "#d69b12", fontWeight: 700, fontFamily: "serif", marginLeft: -20 }}>
            L
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
