import { NextResponse } from "next/server";

import { readLessonFile } from "@/lib/lesson-builder/server/lesson-store";

export async function GET() {
  try {
    return NextResponse.json(await readLessonFile());
  } catch {
    return NextResponse.json(
      { error: "Unable to read a valid lessons file." },
      { status: 500 },
    );
  }
}
