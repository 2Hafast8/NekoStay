import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NekoStay — Penitipan Kucing Premium";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(245, 158, 11, 0.15), transparent 50%), radial-gradient(circle at 75% 75%, rgba(217, 119, 6, 0.1), transparent 50%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: "60px 80px",
          textAlign: "center",
        }}
      >
        {/* Top Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            color: "#f59e0b",
            padding: "8px 24px",
            borderRadius: "9999px",
            fontSize: "20px",
            fontWeight: "700",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "24px",
          }}
        >
          <span>🐾 Penitipan Kucing Premium</span>
        </div>

        {/* Brand Name */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "900",
            color: "#f59e0b",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: "16px",
          }}
        >
          NekoStay
        </div>

        {/* Tagline / Subtitle */}
        <div
          style={{
            fontSize: "28px",
            color: "#a1a1aa",
            maxWidth: "850px",
            lineHeight: 1.4,
            fontWeight: "500",
            marginBottom: "40px",
          }}
        >
          Platform Penitipan Kucing Modern dengan Laporan Berkala, Dokter Hewan Siaga & Kalkulasi Otomatis
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              color: "#e4e4e7",
              padding: "12px 24px",
              borderRadius: "16px",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            📸 Laporan Berkala
          </div>
          <div
            style={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              color: "#e4e4e7",
              padding: "12px 24px",
              borderRadius: "16px",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            🩺 Dokter Hewan Siaga
          </div>
          <div
            style={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              color: "#e4e4e7",
              padding: "12px 24px",
              borderRadius: "16px",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            ⚡ Pembayaran Otomatis
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
