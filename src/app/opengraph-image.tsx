import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Manideep Daram — Frontend & Full-Stack Developer";
export const size = { width: 1200, height: 630 };
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
          justifyContent: "center",
          padding: "60px",
          backgroundColor: "#fafaf9",
          border: "1px solid #e7e5e4",
        }}
      >
        <div style={{ fontSize: 20, color: "#78716c", letterSpacing: 2, textTransform: "uppercase" }}>Hyderabad · Available immediately</div>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#1c1917", marginTop: 16, lineHeight: 1.1 }}>Manideep Daram</div>
        <div style={{ fontSize: 28, color: "#44403c", marginTop: 12 }}>Frontend & Full-Stack Developer</div>
        <div style={{ fontSize: 18, color: "#78716c", marginTop: 16 }}>TypeScript · React · Next.js · Node.js · Supabase · Flutter</div>
        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          <div style={{ backgroundColor: "#1c1917", color: "#fafaf9", padding: "10px 18px", borderRadius: 8, fontSize: 14 }}>manideep-portfolio-navy.vercel.app</div>
          <div style={{ border: "1px solid #e7e5e4", color: "#78716c", padding: "10px 18px", borderRadius: 8, fontSize: 14 }}>4 projects · Free & Open Source</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
