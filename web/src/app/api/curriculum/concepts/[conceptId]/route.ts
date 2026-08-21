import { NextResponse } from "next/server";

import {
  isCurriculumConcept,
  mutateCurriculumFile,
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
    const curriculumFile = await mutateCurriculumFile((currentFile) => {
      const conceptIndex = currentFile.concepts.findIndex(
        (candidate) => candidate.id === conceptId,
      );

      if (conceptIndex < 0) {
        throw new Error("Concept not found.");
      }

      const concepts = [...currentFile.concepts];
      concepts[conceptIndex] = {
        ...concept,
        spanish: concept.spanish.trim(),
        english: concept.english.trim(),
        example: {
          spanish: concept.example.spanish.trim(),
          english: concept.example.english.trim(),
        },
        collections: concept.collections.map((collection) => collection.trim()),
      };

      return { ...currentFile, concepts };
    });

    return NextResponse.json(curriculumFile);
  } catch (error) {
    const notFound =
      error instanceof Error && error.message === "Concept not found.";
    return NextResponse.json(
      { error: notFound ? "Concept not found." : "Unable to save concept." },
      { status: notFound ? 404 : 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { conceptId } = await context.params;

  try {
    const curriculumFile = await mutateCurriculumFile((currentFile) => {
      if (!currentFile.concepts.some((concept) => concept.id === conceptId)) {
        throw new Error("Concept not found.");
      }

      return {
        ...currentFile,
        concepts: currentFile.concepts.filter(
          (concept) => concept.id !== conceptId,
        ),
      };
    });

    return NextResponse.json(curriculumFile);
  } catch (error) {
    const notFound =
      error instanceof Error && error.message === "Concept not found.";
    return NextResponse.json(
      { error: notFound ? "Concept not found." : "Unable to delete concept." },
      { status: notFound ? 404 : 500 },
    );
  }
}
