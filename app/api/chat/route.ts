import { NextResponse } from "next/server";
import { askCosmo } from "@/lib/cosmo/brain";
import { LIMITS } from "@/lib/cosmo/config";
import { rateLimit } from "@/lib/rateLimit";
import type { ChatRequest } from "@/lib/types";

// POST /api/chat
// Body:    { messages: [{ role: "user" | "bot", text: string }, ...] }
// Returns: ChatReply (see lib/types.ts)
//
// This route is the front door to Cosmo's brain (lib/cosmo/brain.ts).
// It rejects anything suspicious before the AI is ever called.

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  // 1. Only accept calls from our own website, not other sites' pages.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Rate limit per visitor.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(ip, LIMITS.perMinute);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many questions, slow down a little!" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  // 3. Validate the request.
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const history = sanitize(body);
  if (!history) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  // 4. Ask Cosmo.
  const reply = await askCosmo(history);
  return NextResponse.json(reply, { headers: { "Cache-Control": "no-store" } });
}

/** Keep only well-formed, size-limited messages, ending with the kid's question. */
function sanitize(body: ChatRequest): ChatRequest["messages"] | null {
  if (!body || !Array.isArray(body.messages)) return null;

  const messages = body.messages
    .filter((m) => (m?.role === "user" || m?.role === "bot") && typeof m.text === "string" && m.text.trim())
    .slice(-LIMITS.historyMessages)
    .map((m) => ({ role: m.role, text: m.text.trim().slice(0, LIMITS.maxHistoryChars) }));

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") return null;
  if (last.text.length > LIMITS.maxQuestionChars) return null;
  return messages;
}
