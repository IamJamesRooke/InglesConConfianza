// Tiny in-memory per-key rate limiter, shared by the public POST endpoints
// that need light flood/abuse friction (admin-login's brute-force guard,
// the feedback endpoint's per-visitor limit). Single-instance only — this
// is not abuse-hardening, just enough to slow down a naive script. Each
// caller gets its own Map (via createRateLimiter), so limits never bleed
// between endpoints.

export type RateLimiter = {
  /** Records a hit for `key` now and reports whether it is over the limit. */
  isRateLimited(key: string): boolean;
};

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  maxKeys?: number;
}): RateLimiter {
  const { windowMs, max, maxKeys = 1000 } = options;
  const hits = new Map<string, number[]>();

  return {
    isRateLimited(key: string): boolean {
      const now = Date.now();
      // Evict stale keys once the map grows large, so a flood of spoofed
      // identifiers (e.g. X-Forwarded-For) can't grow this unbounded.
      if (hits.size > maxKeys) {
        for (const [mapKey, timestamps] of hits) {
          const recent = timestamps.filter((t) => now - t < windowMs);
          if (recent.length === 0) hits.delete(mapKey);
          else hits.set(mapKey, recent);
        }
      }
      const recent = (hits.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
      recent.push(now);
      hits.set(key, recent);
      return recent.length > max;
    },
  };
}

/** Shared across routes that key on the caller's IP. */
export function clientKeyFromHeaders(headers: {
  get(name: string): string | null;
}): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
