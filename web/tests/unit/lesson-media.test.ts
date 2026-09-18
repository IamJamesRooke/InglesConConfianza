import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  detectImageType,
  isDangerousSvg,
  isExplanationImage,
  isLessonMediaFilename,
  lessonMediaFilename,
  slugifyAlt,
} from "../../src/lib/lesson-builder/lesson-media";

// Part A — image validation + filename rule + SVG rejection rules
// (docs/design/lesson-builder.md, docs/design/onboarding.md "media option").

test("isLessonMediaFilename accepts bare lowercase filenames with an allowed extension", () => {
  assert.equal(isLessonMediaFilename("preparar-arrow-1a2b3c4d5e.svg"), true);
  assert.equal(isLessonMediaFilename("photo-0123456789.png"), true);
  assert.equal(isLessonMediaFilename("a.jpg"), true);
  assert.equal(isLessonMediaFilename("a.jpeg"), true);
  assert.equal(isLessonMediaFilename("a.webp"), true);
});

test("isLessonMediaFilename rejects paths, uppercase, and disallowed extensions", () => {
  assert.equal(isLessonMediaFilename("../etc/passwd.svg"), false);
  assert.equal(isLessonMediaFilename("lesson-media/x.svg"), false);
  assert.equal(isLessonMediaFilename("Photo.png"), false);
  assert.equal(isLessonMediaFilename("photo.gif"), false);
  assert.equal(isLessonMediaFilename("photo.SVG"), false);
  assert.equal(isLessonMediaFilename("-leading-dash.svg"), false);
  assert.equal(isLessonMediaFilename(""), false);
  assert.equal(isLessonMediaFilename(42), false);
});

test("isExplanationImage validates the { file, alt } shape", () => {
  assert.equal(isExplanationImage({ file: "a.png", alt: "" }), true);
  assert.equal(isExplanationImage({ file: "a.png", alt: "Una foto" }), true);
  assert.equal(isExplanationImage({ file: "A.png", alt: "" }), false);
  assert.equal(isExplanationImage({ file: "a.png" }), false);
  assert.equal(isExplanationImage({ file: "a.png", alt: 3 }), false);
  assert.equal(isExplanationImage(null), false);
  assert.equal(isExplanationImage("a.png"), false);
});

test("slugifyAlt lowercases, strips accents, and collapses non-alphanumerics", () => {
  assert.equal(slugifyAlt("preparar → to prepare"), "preparar-to-prepare");
  assert.equal(slugifyAlt("José está aquí"), "jose-esta-aqui");
  assert.equal(slugifyAlt("   "), "imagen");
  assert.equal(slugifyAlt(""), "imagen");
  assert.equal(slugifyAlt("---"), "imagen");
});

test("lessonMediaFilename combines the alt slug and a 10-hex hash prefix", () => {
  const sha1Hex = createHash("sha1").update("hello").digest("hex");
  const filename = lessonMediaFilename("Preparar", "svg", sha1Hex);
  assert.equal(filename, `preparar-${sha1Hex.slice(0, 10)}.svg`);
  assert.match(filename, /^[a-z0-9][a-z0-9-]*\.svg$/);
});

test("lessonMediaFilename dedupes identical content: same alt + hash -> same name", () => {
  const sha1Hex = createHash("sha1").update("same bytes").digest("hex");
  const a = lessonMediaFilename("Foto", "png", sha1Hex);
  const b = lessonMediaFilename("Foto", "png", sha1Hex);
  assert.equal(a, b);
});

test("lessonMediaFilename maps jpeg's sniffed type to a .jpg extension", () => {
  const sha1Hex = createHash("sha1").update("x").digest("hex");
  assert.match(lessonMediaFilename("x", "jpeg", sha1Hex), /\.jpg$/);
});

test("detectImageType sniffs PNG/JPEG/WebP magic bytes, not a claimed MIME type", () => {
  assert.equal(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0])), "png");
  assert.equal(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0, 0])), "jpeg");
  const webp = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0, 0, 0, 0]),
    Buffer.from("WEBP", "ascii"),
  ]);
  assert.equal(detectImageType(webp), "webp");
});

test("detectImageType sniffs SVG by content, an XML prolog optional", () => {
  assert.equal(detectImageType(Buffer.from("<svg xmlns='...'></svg>")), "svg");
  assert.equal(
    detectImageType(Buffer.from('<?xml version="1.0"?>\n<svg></svg>')),
    "svg",
  );
  assert.equal(detectImageType(Buffer.from("  \n<svg></svg>")), "svg");
});

test("detectImageType returns null for an unrecognized type, e.g. a GIF or plain text", () => {
  assert.equal(detectImageType(Buffer.from("GIF89a")), null);
  assert.equal(detectImageType(Buffer.from("just some text")), null);
  assert.equal(detectImageType(Buffer.alloc(0)), null);
});

test("isDangerousSvg rejects <script>, <foreignObject>, and on*= attributes", () => {
  assert.equal(isDangerousSvg("<svg><script>alert(1)</script></svg>"), true);
  assert.equal(
    isDangerousSvg("<svg><foreignObject><body>hi</body></foreignObject></svg>"),
    true,
  );
  assert.equal(isDangerousSvg('<svg onload="alert(1)"><rect/></svg>'), true);
  assert.equal(isDangerousSvg('<svg><rect onclick="x()"/></svg>'), true);
  // Case-insensitive.
  assert.equal(isDangerousSvg("<svg><SCRIPT>bad()</SCRIPT></svg>"), true);
});

test("isDangerousSvg accepts an ordinary safe SVG", () => {
  assert.equal(
    isDangerousSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>',
    ),
    false,
  );
});
