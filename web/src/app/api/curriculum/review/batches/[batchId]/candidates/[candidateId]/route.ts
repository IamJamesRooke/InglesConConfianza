import { NextResponse } from "next/server";

import {
  ReviewBatchNotFoundError,
  ReviewCandidateNotFoundError,
  isReviewCandidate,
  updateReviewCandidate,
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
    const updatedCandidate = await updateReviewCandidate(batchId, candidate);
    return NextResponse.json({ candidate: updatedCandidate });
  } catch (error) {
    const notFound =
      error instanceof ReviewBatchNotFoundError ||
      error instanceof ReviewCandidateNotFoundError;
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { error: notFound ? message : "Unable to save review candidate." },
      { status: notFound ? 404 : 500 },
    );
  }
}
