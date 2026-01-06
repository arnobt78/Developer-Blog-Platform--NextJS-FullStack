import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Dev-Bug-Coder-Blog - Developer Community";
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
          fontSize: 60,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 20 }}>🐛 💻</div>
        <div style={{ marginBottom: 20 }}>Dev-Bug-Coder-Blog</div>
        <div style={{ fontSize: 35, fontWeight: "normal", opacity: 0.9 }}>
          Developer Community for Coding Errors & Solutions
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
