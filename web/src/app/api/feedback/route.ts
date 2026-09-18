import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";

import { buildFeedbackIssue, createFeedbackIssue } from "@/lib/feedback/github-issue";
import { isHoneypotTripped, validateFeedbackPayload } from "@/lib/feedback/validate";
import { clientKeyFromHeaders, createRateLimiter } from "@/lib/rate-limit";

// Per-slide feedback (docs/backlog.md "Per-slide feedback" and "Feedback to
// issues", docs/engineering/feedback.md). Public, no auth: a learner note
// about a slide. Delivery order: a GitHub issue in the private feedback
// repo when FEEDBACK_GITHUB_TOKEN + FEEDBACK_GITHUB_REPO are set; otherwise
// the original webhook (if configured) or a local data/feedback.jsonl
// append, unchanged.
export const dynamic = "force-dynamic";

// Per-visitor limit (docs/backlog.md "Feedback to issues"): 5 comments per
// 10 minutes per IP. In-memory, single-instance guard — a light flood
// guard, not abuse-hardening.
const feedbackLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 5 });

// Reject oversized bodies before JSON.parse — a public, unauthenticated
// endpoint should not let a caller force large allocations/writes.
const MAX_BODY_BYTES = 32 * 1024;

function clientKey(request: NextRequest): string {
  return clientKeyFromHeaders(request.headers);
}

const FEEDBACK_LOG_PATH = path.join(process.cwd(), "data", "feedback.jsonl");

export async function POST(request: NextRequest) {
  if (feedbackLimiter.isRateLimited(clientKey(request))) {
    return NextResponse.json(
      {
        error: "Recibimos varios comentarios tuyos seguidos. Inténtalo en unos minutos.",
      },
      { status: 429 },
    );
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader && Number(contentLengthHeader) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  // Content-Length can be absent/spoofed; re-check the actual body.
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validated = validateFeedbackPayload(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  const record = validated.value;

  // Honeypot: a bot that fills every field it can find trips the
  // `website` field a human never sees. Drop the comment silently — the
  // learner (or bot) still sees an ordinary success response.
  if (isHoneypotTripped(body)) {
    return NextResponse.json({ ok: true });
  }

  // Delivery never fails visibly to the learner — any failure below is
  // logged (full validated payload, never the GitHub token) and the route
  // still returns success. This is the Vercel-log fallback when nothing
  // else captured the note.
  let deliveryError: string | null = null;

  const githubToken = process.env.FEEDBACK_GITHUB_TOKEN;
  const githubRepo = process.env.FEEDBACK_GITHUB_REPO;
  if (githubToken && githubRepo) {
    const issue = buildFeedbackIssue(record);
    const result = await createFeedbackIssue(issue, { token: githubToken, repo: githubRepo });
    if (!result.ok) deliveryError = `github: ${result.error}`;
  } else {
    const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(record),
            signal: controller.signal,
          });
          if (!response.ok) deliveryError = `webhook: responded ${response.status}`;
        } finally {
          clearTimeout(timeout);
        }
      } catch (error) {
        deliveryError = `webhook: ${error instanceof Error ? error.message : "request failed"}`;
      }
    } else {
      try {
        await mkdir(path.dirname(FEEDBACK_LOG_PATH), { recursive: true });
        await appendFile(FEEDBACK_LOG_PATH, `${JSON.stringify(record)}\n`, "utf8");
      } catch (error) {
        deliveryError = `jsonl: ${error instanceof Error ? error.message : "write failed"}`;
      }
    }
  }

  if (deliveryError) {
    // Structured single line, full validated payload — never the token,
    // never raw request headers.
    console.error(
      JSON.stringify({ event: "feedback_delivery_failed", error: deliveryError, payload: record }),
    );
  }

  return NextResponse.json({ ok: true });
}
