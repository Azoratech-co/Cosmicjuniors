// Central settings for Cosmo's brain. Change models or limits here.

export const MODELS = {
  /** Writes Cosmo's answers. Tried in order: if one is busy (rate limited), the next is used. */
  // Each Groq model has its own free-tier rate limit, so more backups = more capacity.
  // Groq checks which ones exist at runtime, so retired names are skipped automatically.
  chat: [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b",
    "moonshotai/kimi-k2-instruct",
  ],
  /** Extra backups: any other available model whose name matches these (if the list above runs dry). */
  chatFamilies: /(gpt-oss|llama-4|llama-3\.3|qwen3|kimi)/,
  /** Never use these for chat (safety classifiers, speech, tools). */
  notChat: /(guard|safeguard|whisper|tts|playai|orpheus|compound|distil)/,
  /** Detects attempts to trick Cosmo into ignoring its rules. */
  promptGuard: "meta-llama/llama-prompt-guard-2-86m",
} as const;

export const LIMITS = {
  /** Longest question a kid can send (matches the input box). */
  maxQuestionChars: 300,
  /** Longest earlier message we pass back to the model. */
  maxHistoryChars: 800,
  /** How many recent messages Cosmo remembers. */
  historyMessages: 6,
  /** Requests allowed per visitor per minute. */
  perMinute: 10,
  /** Prompt Guard score above which a message counts as a trick attempt. */
  jailbreakThreshold: 0.85,
  /** Give up on Groq after this long and fall back to a safe reply. */
  timeoutMs: 15000,
} as const;
