import type { KnowledgeEntry } from "./types";

const SYSTEM_PROMPT = `You are a business analyst compiling client information into a structured knowledge base document. Organize the following information into a clean, well-formatted markdown document with these sections (omit sections with no data):

# {Business Name} — Client Knowledge Base

## Business Overview
## Services / Products
## Contact Information
## Brand Identity (colors, logos, tone, style preferences)
## Target Audience
## Competitive Landscape
## Client Preferences & Notes
## Technical Requirements
## Media Assets

Be thorough but concise. Extract and organize all relevant details. Use bullet points for lists. Preserve specific details like exact color codes, phone numbers, addresses, etc.`;

// Simple token estimation: ~4 chars per token (commonly used heuristic)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
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
  // Build the same message structure as the compile route
  const entryTexts = entries.map((entry) => {
    if (entry.type === "screenshot") {
      return `[Type: ${entry.type}] [Screenshot uploaded: ${entry.title}]`;
    }
    if (!entry.content) {
      return `[Type: ${entry.type}] [File: ${entry.title}]`;
    }
    return `[Type: ${entry.type}] ${entry.title}\n${entry.content}`;
  });

  const userMessage = `Compile the following ${entries.length} knowledge entries into a structured knowledge base document for "${clientName}":\n\n${entryTexts.join("\n\n---\n\n")}`;

  // Full prompt = system + user message
  const fullPrompt = SYSTEM_PROMPT + "\n\n" + userMessage;

  // Estimate input tokens
  const inputTokens = estimateTokens(fullPrompt);

  // Estimate output tokens: roughly 60% of input for compilation tasks, capped at max_tokens (4096)
  const estimatedOutputTokens = Math.min(Math.ceil(inputTokens * 0.6), 4096);

  // Claude Haiku 4.5 pricing: $0.80/MTok input, $4.00/MTok output
  const inputCost = (inputTokens / 1_000_000) * 0.8;
  const outputCost = (estimatedOutputTokens / 1_000_000) * 4.0;
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
