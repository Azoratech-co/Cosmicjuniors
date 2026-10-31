import { NextResponse } from "next/server";
import { mockReply } from "@/lib/mockBrain";
import type { ChatReply, ChatRequest } from "@/lib/types";

// POST /api/chat
// Body:    { messages: [{ role: "user" | "bot", text: string }, ...] }
// Returns: ChatReply (see lib/types.ts)
//
// This is the seam between the UI and the AI. Right now it uses canned
// answers from lib/mockBrain.ts. To plug in a real model, replace the
// `mockReply(...)` call below and keep returning a ChatReply.

export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lastUser = [...(body.messages ?? [])].reverse().find((m) => m.role === "user");
  if (!lastUser?.text?.trim()) {
    return NextResponse.json({ error: "No question found" }, { status: 400 });
  }

  // Small delay so the "Cosmo is thinking…" state is visible in the demo.
  await new Promise((r) => setTimeout(r, 700));

  const reply: ChatReply = mockReply(lastUser.text);
  return NextResponse.json(reply);
}
