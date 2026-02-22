import type {
  OnboardConfig,
  OnboardSubmission,
  AnswerValue,
  AddressValue,
  QuestionConfig,
} from "./types";

/**
 * Formats an answer value as readable text for markdown output.
 */
function formatAnswer(question: QuestionConfig, answer: AnswerValue): string {
  if (answer === null || answer === undefined) {
    return "_No answer provided_";
  }

  switch (question.type) {
    case "text":
    case "textarea":
    case "select":
      return typeof answer === "string" && answer.trim()
        ? answer
        : "_No answer provided_";

    case "multi_select":
      if (Array.isArray(answer) && answer.length > 0) {
        return answer.map((v) => `- ${v}`).join("\n");
      }
      return "_No selections made_";

    case "file_upload":
      if (Array.isArray(answer) && answer.length > 0) {
        return answer.map((url) => `- [${url}](${url})`).join("\n");
      }
      return "_No files uploaded_";

    case "yes_no":
      if (typeof answer === "boolean") {
        return answer ? "Yes" : "No";
      }
      return "_No answer provided_";

    case "color_picker":
    case "color_confirm":
      return typeof answer === "string" && answer.trim()
        ? `\`${answer}\``
        : "_No color selected_";

    case "address": {
      if (typeof answer === "object" && !Array.isArray(answer)) {
        const addr = answer as AddressValue;
        const parts = [addr.street, addr.city, addr.state, addr.zip].filter(
          (p) => p?.trim()
        );
        return parts.length > 0 ? parts.join(", ") : "_No address provided_";
      }
      return "_No address provided_";
    }

    default:
      return String(answer);
  }
}

/**
 * Generates a markdown document from a config and submission.
 * Each question becomes an H2 heading with its answer below.
 */
export function generateMarkdown(
  config: OnboardConfig,
  submission: OnboardSubmission
): string {
  const lines: string[] = [];

  lines.push(`# ${config.business_name} — Onboarding Submission`);
  lines.push("");
  lines.push(`**Client:** ${config.client_name}`);
  lines.push(`**Status:** ${submission.status}`);

  if (submission.submitted_at) {
    lines.push(
      `**Submitted:** ${new Date(submission.submitted_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
    );
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  for (const question of config.config.questions) {
    const answer = submission.answers[question.id] ?? null;
    const fileUrls = submission.file_urls?.[question.id];

    lines.push(`## ${question.question}`);
    lines.push("");

    if (question.type === "file_upload" && fileUrls && fileUrls.length > 0) {
      // Use file_urls from submission if available for file uploads
      lines.push(fileUrls.map((url) => `- [${url}](${url})`).join("\n"));
    } else {
      lines.push(formatAnswer(question, answer));
    }

    lines.push("");
  }

  return lines.join("\n");
}
