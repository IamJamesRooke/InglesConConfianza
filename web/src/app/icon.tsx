import { ImageResponse } from "next/og";

// Generated from the same "three rounded stepping stones" geometry as
// src/components/brand-mark.tsx's `tile` variant (rounded-[28%] bg-primary
// container, stones at 60% of the tile). Kept in sync by hand — brand-mark
// itself can't be imported here (it renders a real DOM/SVG tree, not the
// primitive JSX satori accepts) — so if the mark's geometry changes, update
// both.
const PRIMARY = "#2448c8";
const ON_PRIMARY = "#ffffff";

export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "180", size: { width: 180, height: 180 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: PRIMARY,
          borderRadius: "28%",
        }}
      >
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
        >
          <rect x="2" y="15.5" width="8" height="5" rx="2.5" fill={ON_PRIMARY} />
          <rect x="8" y="9.5" width="8" height="5" rx="2.5" fill={ON_PRIMARY} />
          <rect x="14" y="3.5" width="8" height="5" rx="2.5" fill={ON_PRIMARY} />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
