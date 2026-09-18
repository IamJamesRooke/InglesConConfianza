import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";

import { validateFeedbackPayload } from "@/lib/feedback/validate";

// Per-slide feedback (docs/backlog.md "Per-slide feedback",
// docs/engineering/feedback.md). Public, no auth: a learner note about a
// slide, forwarded to the owner's Google Sheet webhook when configured, or
// appended locally so `npm run dev` still captures it.
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
// Per-IP timestamps of recent requests. Fine as an in-memory Map for a
// single-instance deployment (direction: this is a light guard against
// accidental floods, not abuse-hardening).
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_MAX_KEYS = 1000;

// Reject oversized bodies before JSON.parse — a public, unauthenticated
// endpoint should not let a caller force large allocations/writes.
const MAX_BODY_BYTES = 32 * 1024;

function clientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  // Evict stale keys once the map grows large, so a flood of spoofed
  // X-Forwarded-For values can't grow this unbounded.
  if (requestLog.size > RATE_LIMIT_MAX_KEYS) {
    for (const [mapKey, timestamps] of requestLog) {
      const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (recent.length === 0) requestLog.delete(mapKey);
      else requestLog.set(mapKey, recent);
    }
  }
  const recent = (requestLog.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  recent.push(now);
  requestLog.set(key, recent);
  return recent.length > RATE_LIMIT_MAX;
}

const FEEDBACK_LOG_PATH = path.join(process.cwd(), "data", "feedback.jsonl");

export async function POST(request: NextRequest) {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
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

  const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      let response: Response;
      try {
        response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
      return NextResponse.json(
        { ok: response.ok },
        { status: response.ok ? 200 : 502 },
      );
    } catch {
      // Never log the message body — only that the forward failed.
      return NextResponse.json(
        { error: "Unable to reach the feedback service." },
        { status: 502 },
      );
    }
  }

  try {
    await mkdir(path.dirname(FEEDBACK_LOG_PATH), { recursive: true });
    await appendFile(FEEDBACK_LOG_PATH, `${JSON.stringify(record)}\n`, "utf8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to store feedback." },
      { status: 500 },
    );
  }
}
