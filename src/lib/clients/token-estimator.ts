import type { KnowledgeEntry } from "./types";

// Claude vision: images cost ~5,000 tokens each (varies by resolution, but this is a solid average)
const IMAGE_TOKENS = 5000;

const IMAGE_FILE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/avif"];

const SYSTEM_PROMPT_TOKENS = 450; // ~1,800 chars / 4

// Simple token estimation: ~4 chars per token (commonly used heuristic)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function isImageEntry(entry: KnowledgeEntry): boolean {
  if (entry.type === "screenshot") return true;
  if (!entry.file_type) return false;
  return IMAGE_FILE_TYPES.includes(entry.file_type);
}

export function estimateCompilationCost(
  entries: KnowledgeEntry[],
  clientName: string
): {
  inputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: string;
  formattedInput: string;
  formattedOutput: string;
} {
  const imageEntries = entries.filter(isImageEntry);
  const textEntries = entries.filter((e) => !isImageEntry(e));

  // Build the same text message structure as the compile route
  const entryTexts = textEntries.map((entry) => {
    if (!entry.content) {
      return `[Type: ${entry.type}] [File: ${entry.title}]`;
    }
    return `[Type: ${entry.type}] ${entry.title}\n${entry.content}`;
  });

  const userMessage = `Compile the following ${entries.length} knowledge entries into a structured knowledge base document for "${clientName}":\n\n${entryTexts.join("\n\n---\n\n")}`;

  // Text tokens from system prompt + user message
  const textTokens = SYSTEM_PROMPT_TOKENS + estimateTokens(userMessage);

  // Image tokens: ~5,000 per image
  const imageTokens = imageEntries.length * IMAGE_TOKENS;

  const inputTokens = textTokens + imageTokens;

  // Estimate output tokens: roughly 60% of input for compilation tasks, capped at max_tokens (4096)
  const estimatedOutputTokens = Math.min(Math.ceil(inputTokens * 0.6), 4096);

  // Claude Sonnet 4.5 pricing: $3.00/MTok input, $15.00/MTok output
  const inputCost = (inputTokens / 1_000_000) * 3.0;
  const outputCost = (estimatedOutputTokens / 1_000_000) * 15.0;
  const totalCost = inputCost + outputCost;

  return {
    inputTokens,
    estimatedOutputTokens,
    estimatedCost: `$${totalCost.toFixed(4)}`,
    formattedInput: formatTokenCount(inputTokens),
    formattedOutput: formatTokenCount(estimatedOutputTokens),
  };
}

function formatTokenCount(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
}
