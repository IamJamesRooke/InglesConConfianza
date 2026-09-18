import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/assert-admin";
import { validateImportedFile } from "@/lib/lesson-builder/import-export";
import { mutateLessonFile, readLessonFile } from "@/lib/lesson-builder/server/lesson-store";

// GET: the whole current lessons.json, for Export. PUT: replace the whole
// file with a validated import — see docs/design/module-syllabus.md
// §Backup. Both admin-only, same as every other /api/admin/lesson-builder
// route.
export async function GET() {
  const denied = await adminGuardResponse();
  if (denied) return denied;

  const file = await readLessonFile();
  return NextResponse.json(file);
}

export async function PUT(request: Request) {
  const denied = await adminGuardResponse();
  if (denied) return denied;

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
