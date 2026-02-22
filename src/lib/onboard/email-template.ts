import type {
  OnboardConfig,
  OnboardSubmission,
  AnswerValue,
  AddressValue,
  QuestionConfig,
} from "./types";

/**
 * Formats an answer value as plain text for email display.
 */
function formatAnswerText(
  question: QuestionConfig,
  answer: AnswerValue
): string {
  if (answer === null || answer === undefined) {
    return "No answer provided";
  }

  switch (question.type) {
    case "text":
    case "textarea":
    case "select":
      return typeof answer === "string" && answer.trim()
        ? answer
        : "No answer provided";

    case "multi_select":
      if (Array.isArray(answer) && answer.length > 0) {
        return answer.join(", ");
      }
      return "No selections made";

    case "file_upload":
      if (Array.isArray(answer) && answer.length > 0) {
        return `${answer.length} file(s) uploaded`;
      }
      return "No files uploaded";

    case "yes_no":
      if (typeof answer === "boolean") {
        return answer ? "Yes" : "No";
      }
      return "No answer provided";

    case "color_picker":
    case "color_confirm":
      return typeof answer === "string" && answer.trim()
        ? answer
        : "No color selected";

    case "address": {
      if (typeof answer === "object" && !Array.isArray(answer)) {
        const addr = answer as AddressValue;
        const parts = [addr.street, addr.city, addr.state, addr.zip].filter(
          (p) => p?.trim()
        );
        return parts.length > 0 ? parts.join(", ") : "No address provided";
      }
      return "No address provided";
    }

    default:
      return String(answer);
  }
}

/**
 * Escapes HTML special characters to prevent XSS in email output.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Renders a single answer as an HTML table row.
 */
function renderAnswerRow(
  question: QuestionConfig,
  answer: AnswerValue,
  fileUrls?: string[]
): string {
  // For file uploads, render clickable links
  if (
    question.type === "file_upload" &&
    fileUrls &&
    fileUrls.length > 0
  ) {
    const links = fileUrls
      .map(
        (url) =>
          `<a href="${escapeHtml(url)}" style="color: #2563eb; text-decoration: underline;">${escapeHtml(url.split("/").pop() || url)}</a>`
      )
      .join("<br />");

    return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; vertical-align: top; width: 40%;">
          ${escapeHtml(question.question)}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; vertical-align: top;">
          ${links}
        </td>
      </tr>`;
  }

  // For color types, show a swatch
  if (
    (question.type === "color_picker" || question.type === "color_confirm") &&
    typeof answer === "string" &&
    answer.trim()
  ) {
    return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; vertical-align: top; width: 40%;">
          ${escapeHtml(question.question)}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; vertical-align: top;">
          <span style="display: inline-block; width: 16px; height: 16px; border-radius: 3px; background-color: ${escapeHtml(answer)}; vertical-align: middle; margin-right: 8px; border: 1px solid #d1d5db;"></span>
          ${escapeHtml(answer)}
        </td>
      </tr>`;
  }

  // Default text rendering
  const text = formatAnswerText(question, answer);
  return `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; vertical-align: top; width: 40%;">
        ${escapeHtml(question.question)}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; vertical-align: top;">
        ${escapeHtml(text)}
      </td>
    </tr>`;
}

/**
 * Builds a submission notification email with inline CSS styles.
 * Returns the subject line and full HTML body.
 */
export function buildSubmissionEmail(
  config: OnboardConfig,
  submission: OnboardSubmission
): { subject: string; html: string } {
  const subject = `New onboarding submission from ${config.client_name}`;

  const submittedDate = submission.submitted_at
    ? new Date(submission.submitted_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not yet submitted";

  const rows = config.config.questions
    .map((question) => {
      const answer = submission.answers[question.id] ?? null;
      const fileUrls = submission.file_urls?.[question.id];
      return renderAnswerRow(question, answer, fileUrls);
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="margin: 0 auto; max-width: 600px;">

          <!-- Header -->
          <tr>
            <td style="background-color: #111827; padding: 32px 24px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">
                Onboarding Submission
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #9ca3af;">
                ${escapeHtml(config.business_name)}
              </p>
            </td>
          </tr>

          <!-- Meta info -->
          <tr>
            <td style="background-color: #ffffff; padding: 20px 24px; border-bottom: 1px solid #e5e7eb;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 13px; color: #6b7280;">
                    <strong style="color: #374151;">Client:</strong> ${escapeHtml(config.client_name)}
                  </td>
                  <td style="font-size: 13px; color: #6b7280; text-align: right;">
                    <strong style="color: #374151;">Submitted:</strong> ${escapeHtml(submittedDate)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Answers table -->
          <tr>
            <td style="background-color: #ffffff; padding: 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${rows}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 24px; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                This is an automated email from the onboarding system.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
