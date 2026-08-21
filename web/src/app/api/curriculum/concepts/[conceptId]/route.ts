import { NextResponse } from "next/server";

import {
  CurriculumConceptNotFoundError,
  deleteCurriculumConcept,
  isCurriculumConcept,
  updateCurriculumConcept,
} from "@/lib/curriculum/server/curriculum-store";

type RouteContext = {
  params: Promise<{ conceptId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { conceptId } = await context.params;
  let concept: unknown;

  try {
    concept = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isCurriculumConcept(concept) || concept.id !== conceptId) {
    return NextResponse.json(
      { error: "Curriculum concept has an invalid shape." },
      { status: 400 },
    );
  }

  try {
    const updatedConcept = await updateCurriculumConcept(concept);
    return NextResponse.json({ concept: updatedConcept });
  } catch (error) {
    const notFound = error instanceof CurriculumConceptNotFoundError;
    return NextResponse.json(
      { error: notFound ? "Concept not found." : "Unable to save concept." },
      { status: notFound ? 404 : 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { conceptId } = await context.params;

  try {
    const deletedId = await deleteCurriculumConcept(conceptId);
    return NextResponse.json({ deletedId });
  } catch (error) {
    const notFound = error instanceof CurriculumConceptNotFoundError;
    return NextResponse.json(
      { error: notFound ? "Concept not found." : "Unable to delete concept." },
      { status: notFound ? 404 : 500 },
    );
  }
}
