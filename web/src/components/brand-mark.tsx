/** Wordmark monogram: a solid squircle with a bold "C." — echoes the brand's
 *  period device (Habla inglés. Con confianza.). Pure CSS, crisp at any size. */
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="brand-mark"
      style={{ width: size, height: size, fontSize: size * 0.52 }}
    >
      C<span className="brand-mark-dot">.</span>
    </span>
  );
}
