import "server-only";

// Minimal Groq client. Runs on the server only, so the API key never
// reaches the browser. The key comes from the GROQ_API_KEY env variable
// (set in Vercel → Project → Settings → Environment Variables).

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export class GroqError extends Error {
  constructor(
    public status: number,
    /** Groq's short error code, e.g. "json_validate_failed". Never includes the kid's message. */
    public code = "",
    /** Seconds Groq asks us to wait before retrying (from the retry-after header), if any. */
    public retryAfter = 0,
  ) {
    super(`Groq request failed with status ${status}${code ? ` (${code})` : ""}`);
  }
}

export function hasGroqKey() {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function groqChat(body: Record<string, unknown>, timeoutMs: number): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) {
    let code = "";
    try {
      const err = await res.json();
      code = String(err?.error?.code ?? err?.error?.type ?? "").slice(0, 60);
    } catch {}
    throw new GroqError(res.status, code, Number.parseFloat(res.headers.get("retry-after") ?? "") || 0);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

/**
 * The chat models this Groq account can use right now, asked from Groq and remembered for an hour.
 * Groq retires models over time, so Cosmo never depends on a hard-coded list being current.
 */
let cache: { at: number; ids: string[] } | null = null;
export async function availableModels(): Promise<string[]> {
  if (cache && Date.now() - cache.at < 3_600_000) return cache.ids;
  const key = process.env.GROQ_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return cache?.ids ?? [];
    const data = await res.json();
    const ids: string[] = (data?.data ?? [])
      .filter((m: { id?: string; active?: boolean }) => typeof m.id === "string" && m.active !== false)
      .map((m: { id: string }) => m.id);
    cache = { at: Date.now(), ids };
    return ids;
  } catch {
    return cache?.ids ?? [];
  }
}
