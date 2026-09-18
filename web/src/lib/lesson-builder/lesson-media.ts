// Shared rules for an explanation slide's optional image
// (`ExplanationBlock.image`). No fs here — this is imported by both the
// pure lesson-file validator (server and client) and the upload route.
// See docs/design/lesson-builder.md and docs/design/lesson-script-grammar.md.

// A bare filename, no path, living in web/public/lesson-media/.
const LESSON_MEDIA_FILENAME_RE =
  /^[a-z0-9][a-z0-9-]*\.(svg|png|jpg|jpeg|webp)$/;

export function isLessonMediaFilename(value: unknown): value is string {
  return typeof value === "string" && LESSON_MEDIA_FILENAME_RE.test(value);
}

export function isExplanationImage(
  value: unknown,
): value is { file: string; alt: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    isLessonMediaFilename((value as Record<string, unknown>).file) &&
    typeof (value as Record<string, unknown>).alt === "string"
  );
}

// slug-of-alt-or-"imagen" — lowercased, non [a-z0-9] runs collapsed to one
// hyphen, leading/trailing hyphens trimmed; "imagen" when that leaves nothing.
export function slugifyAlt(alt: string): string {
  const slug = alt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents (José -> jose)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "imagen";
}

const EXTENSION_BY_TYPE = {
  svg: "svg",
  png: "png",
  jpeg: "jpg",
  webp: "webp",
} as const;

export type SniffedImageType = keyof typeof EXTENSION_BY_TYPE;

// Content-based filename: <slug-of-alt-or-"imagen">-<first 10 hex of
// sha1(content)>.<ext> — identical content dedupes, names stay readable.
export function lessonMediaFilename(
  alt: string,
  type: SniffedImageType,
  sha1Hex: string,
): string {
  const slug = slugifyAlt(alt);
  const hashPrefix = sha1Hex.slice(0, 10);
  return `${slug}-${hashPrefix}.${EXTENSION_BY_TYPE[type]}`;
}

// The upload route's type sniffing — magic bytes / an `<svg` sniff, never
// the client's declared MIME type. Pure so it's unit-testable without
// spinning up a route handler (see docs/design/lesson-builder.md).
export function detectImageType(bytes: Buffer): SniffedImageType | null {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  // SVG is text: sniff for an opening `<svg` tag within the first chunk (an
  // XML prolog may precede it) rather than trusting the extension.
  const head = bytes.subarray(0, 2048).toString("utf8");
  if (/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(head)) {
    return "svg";
  }
  return null;
}

// SVG is only ever rendered through `<img src>` (never inlined, never
// dangerouslySetInnerHTML), so embedded scripts can't run — but reject the
// obviously hostile cases outright with a clear error, belt and braces.
const SVG_DANGEROUS_RE = /<script[\s>]|<foreignobject[\s>]|\bon\w+\s*=/i;

export function isDangerousSvg(svgText: string): boolean {
  return SVG_DANGEROUS_RE.test(svgText);
}
