const steppingStones = (
  <>
    <rect x="2" y="15.5" width="8" height="5" rx="2.5" fill="currentColor" />
    <rect x="8" y="9.5" width="8" height="5" rx="2.5" fill="currentColor" />
    <rect x="14" y="3.5" width="8" height="5" rx="2.5" fill="currentColor" />
  </>
);

/** Brand mark: three rounded stepping stones rising diagonally — small wins
 *  building into confidence. Flat, single-color SVG (no gradients, no text,
 *  no fine detail) so it stays crisp and legible from favicon scale up.
 *  Decorative by default: the adjacent brand name in each header already
 *  carries the accessible name, so this never needs its own aria-label.
 *
 *  `variant="tile"` (default) is the brand's saturated primary container —
 *  used everywhere except the dark admin header. `variant="bare"` renders
 *  just the white stones with no background container, for the admin
 *  header's navy surface (H1): reuses the same mark, no redesign. */
export function BrandMark({
  size = 36,
  variant = "tile",
}: {
  size?: number;
  variant?: "tile" | "bare";
}) {
  if (variant === "bare") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        className="shrink-0 text-white"
      >
        {steppingStones}
      </svg>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-[28%] bg-primary text-primary-foreground"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.6}
        height={size * 0.6}
        fill="none"
        aria-hidden="true"
      >
        {steppingStones}
      </svg>
    </span>
  );
}
