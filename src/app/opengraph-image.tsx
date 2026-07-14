import { ImageResponse } from "next/og";

export const alt = "HireTrack Lite — hiring momentum without the overhead";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#0e171b",
        color: "#f4f7f6",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "radial-gradient(circle, #24c99a 0%, transparent 66%)",
          borderRadius: 9999,
          display: "flex",
          height: 620,
          opacity: 0.22,
          position: "absolute",
          right: -180,
          top: -280,
          width: 620,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          padding: "72px 88px",
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 18 }}>
          <div
            style={{
              alignItems: "center",
              background: "#24c99a",
              borderRadius: 14,
              color: "#0e171b",
              display: "flex",
              fontSize: 28,
              fontWeight: 800,
              height: 58,
              justifyContent: "center",
              width: 58,
            }}
          >
            H
          </div>
          <span style={{ fontSize: 30, fontWeight: 650 }}>HireTrack Lite</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 74,
            fontWeight: 700,
            letterSpacing: -3.5,
            lineHeight: 1.04,
            maxWidth: 940,
          }}
        >
          Hiring momentum, minus the software overhead.
        </div>
        <div style={{ color: "#aebcb8", display: "flex", fontSize: 27 }}>
          Jobs, candidates, interviews, and decisions in one clear trail.
        </div>
      </div>
    </div>,
    size,
  );
}
