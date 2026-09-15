import { NextResponse } from "next/server";

import { validateImportedFile } from "@/lib/lesson-builder/import-export";
import { mutateLessonFile, readLessonFile } from "@/lib/lesson-builder/server/lesson-store";

// GET: the whole current lessons.json, for Export. PUT: replace the whole
// file with a validated import — see docs/design/module-syllabus.md
// §Backup. Both admin-only, same as every other /api/admin/lesson-builder
// route (no separate auth layer exists yet in this app).
export async function GET() {
  const file = await readLessonFile();
  return NextResponse.json(file);
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validated = validateImportedFile(body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const written = await mutateLessonFile(() => validated.file);
  return NextResponse.json(written);
}
