// Central settings for Sojourner's brain. Change models or limits here.

export const MODELS = {
  /** Writes Sojourner's answers. Tried in order: if one is busy (rate limited), the next is used. */
  chat: ["openai/gpt-oss-120b", "openai/gpt-oss-20b"],
  /** Detects attempts to trick Sojourner into ignoring its rules. */
  promptGuard: "meta-llama/llama-prompt-guard-2-86m",
} as const;

export const LIMITS = {
  /** Longest question a kid can send (matches the input box). */
  maxQuestionChars: 300,
  /** Longest earlier message we pass back to the model. */
  maxHistoryChars: 800,
  /** How many recent messages Sojourner remembers. */
  historyMessages: 10,
  /** Requests allowed per visitor per minute. */
  perMinute: 10,
  /** Prompt Guard score above which a message counts as a trick attempt. */
  jailbreakThreshold: 0.85,
  /** Give up on Groq after this long and fall back to a safe reply. */
  timeoutMs: 15000,
} as const;
