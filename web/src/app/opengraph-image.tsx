import { ImageResponse } from "next/og";

export const alt = "Inglés con Confianza";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#fbfaf6";
const INK = "#17213a";
const RED = "#c82d49";
const BLUE = "#2448c8";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background: PAPER,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 20 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: "28%",
              background: BLUE,
            }}
          >
            <svg width={44} height={44} viewBox="0 0 24 24" fill="none">
              <rect x="2" y="15.5" width="8" height="5" rx="2.5" fill="#fff" />
              <rect x="8" y="9.5" width="8" height="5" rx="2.5" fill="#fff" />
              <rect x="14" y="3.5" width="8" height="5" rx="2.5" fill="#fff" />
            </svg>
          </div>
          <div
            style={{ display: "flex", fontSize: 34, fontWeight: 700, color: INK }}
          >
            Inglés con Confianza
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 56,
            gap: 18,
          }}
        >
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: RED }}>
            Vas a poder decirlo.
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 500, color: BLUE }}>
            You&rsquo;re going to be able to say it.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
