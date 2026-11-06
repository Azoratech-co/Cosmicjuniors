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
    throw new GroqError(res.status, code);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}
