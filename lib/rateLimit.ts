// Simple per-visitor rate limit kept in server memory.
// It stops one person from hammering the API (and using up the Groq quota).
// Note: each Vercel server instance has its own memory, so this is a
// best-effort limit. For a hard limit, add a Vercel Firewall rate-limit rule
// or a shared store like Upstash Redis.

const hits = new Map<string, number[]>();

export function rateLimit(key: string, perMinute: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (recent.length >= perMinute) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((recent[0] + 60_000 - now) / 1000) };
  }

  recent.push(now);
  hits.set(key, recent);

  // Keep memory small: occasionally drop visitors with no recent requests.
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (times.every((t) => t <= windowStart)) hits.delete(k);
  }
  return { ok: true, retryAfter: 0 };
}
