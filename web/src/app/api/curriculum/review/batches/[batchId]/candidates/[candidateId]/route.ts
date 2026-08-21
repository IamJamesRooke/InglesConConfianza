import { NextResponse } from "next/server";

import {
  isReviewCandidate,
  mutateReviewFile,
} from "@/lib/curriculum/server/review-store";

type RouteContext = {
  params: Promise<{ batchId: string; candidateId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { batchId, candidateId } = await context.params;
  let candidate: unknown;

  try {
    candidate = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isReviewCandidate(candidate) || candidate.id !== candidateId) {
    return NextResponse.json(
      { error: "Review candidate has an invalid shape." },
      { status: 400 },
    );
  }

  try {
    const reviewFile = await mutateReviewFile((currentFile) => {
      const batchIndex = currentFile.batches.findIndex(
        (batch) => batch.id === batchId,
      );

      if (batchIndex < 0) throw new Error("Batch not found.");

      const batch = currentFile.batches[batchIndex];
      const candidateIndex = batch.candidates.findIndex(
        (item) => item.id === candidateId,
      );

      if (candidateIndex < 0) throw new Error("Candidate not found.");

      const candidates = [...batch.candidates];
      candidates[candidateIndex] = {
        ...candidate,
        spanish: candidate.spanish.trim(),
        english: candidate.english.trim(),
        example: {
          spanish: candidate.example.spanish.trim(),
          english: candidate.example.english.trim(),
        },
        collections: candidate.collections.map((collection) => collection.trim()),
        sourcePaths: candidate.sourcePaths.map((sourcePath) => sourcePath.trim()),
        rationale: candidate.rationale.trim(),
        ownerNote: candidate.ownerNote.trim(),
      };

      const batches = [...currentFile.batches];
      batches[batchIndex] = { ...batch, candidates };
      return { ...currentFile, batches };
    });

    return NextResponse.json(reviewFile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const notFound = message === "Batch not found." || message === "Candidate not found.";
    return NextResponse.json(
      { error: notFound ? message : "Unable to save review candidate." },
      { status: notFound ? 404 : 500 },
    );
  }
}
