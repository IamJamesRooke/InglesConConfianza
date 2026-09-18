import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/assert-admin";
import {
  detectImageType,
  isDangerousSvg,
  lessonMediaFilename,
} from "@/lib/lesson-builder/lesson-media";

// POST an image for an explanation slide (docs/design/onboarding.md "media
// option" / docs/design/lesson-builder.md). Accepts either
// multipart/form-data (a "file" field, optional "alt" field) or a raw body
// with `?alt=` on the query string — the builder uses whichever is
// convenient for the call site (file picker vs. clipboard paste). Max 1 MB.
// The file's real type is sniffed from its bytes, never trusted from the
// client's declared MIME type. Writes to web/public/lesson-media/ and
// returns `{ file: string }`, the bare filename the caller stores on
// `ExplanationBlock.image`.

const MAX_BYTES = 1024 * 1024; // 1 MB
const LESSON_MEDIA_DIR = path.join(process.cwd(), "public", "lesson-media");

async function extractUpload(
  request: Request,
): Promise<{ bytes: Buffer; alt: string } | { error: string }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return { error: "Invalid multipart body." };
    }
    const file = form.get("file");
    const altField = form.get("alt");
    if (!(file instanceof Blob)) {
      return { error: "Missing \"file\" field." };
    }
    const arrayBuffer = await file.arrayBuffer();
    return {
      bytes: Buffer.from(arrayBuffer),
      alt: typeof altField === "string" ? altField : "",
    };
  }

  const url = new URL(request.url);
  const alt = url.searchParams.get("alt") ?? "";
  const arrayBuffer = await request.arrayBuffer();
  return { bytes: Buffer.from(arrayBuffer), alt };
}

export async function POST(request: Request) {
  const denied = await adminGuardResponse();
  if (denied) return denied;

  const upload = await extractUpload(request);
  if ("error" in upload) {
    return NextResponse.json({ error: upload.error }, { status: 400 });
  }
  const { bytes, alt } = upload;

  if (bytes.length === 0) {
    return NextResponse.json({ error: "Empty file." }, { status: 400 });
  }
  if (bytes.length > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is larger than 1 MB." },
      { status: 400 },
    );
  }

  const type = detectImageType(bytes);
  if (!type) {
    return NextResponse.json(
      { error: "Unrecognized image type — use SVG, PNG, JPEG, or WebP." },
      { status: 400 },
    );
  }

  if (type === "svg") {
    const text = bytes.toString("utf8");
    if (isDangerousSvg(text)) {
      return NextResponse.json(
        {
          error:
            "SVG rejected: it must not contain <script>, <foreignObject>, or on*= event attributes.",
        },
        { status: 400 },
      );
    }
  }

  const sha1Hex = createHash("sha1").update(bytes).digest("hex");
  const filename = lessonMediaFilename(alt, type, sha1Hex);

  try {
    await mkdir(LESSON_MEDIA_DIR, { recursive: true });
    await writeFile(path.join(LESSON_MEDIA_DIR, filename), bytes);
  } catch {
    // Read-only filesystem (e.g. Vercel) or another fs failure — same shape
    // as the other write routes' generic failure.
    return NextResponse.json(
      { error: "Unable to save the image." },
      { status: 500 },
    );
  }

  return NextResponse.json({ file: filename });
}
