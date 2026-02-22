import type { QuestionConfig, AnswerValue, AddressValue } from "./types";

/**
 * Validates an answer against its question configuration.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateAnswer(
  question: QuestionConfig,
  answer: AnswerValue
): string | null {
  // Required check
  if (question.required) {
    if (answer === null || answer === undefined) {
      return `${question.question} is required`;
    }

    if (typeof answer === "string" && answer.trim() === "") {
      return `${question.question} is required`;
    }

    if (Array.isArray(answer) && answer.length === 0) {
      return `Please select at least one option`;
    }
  }

  // If not required and empty, skip further validation
  if (answer === null || answer === undefined) {
    return null;
  }

  switch (question.type) {
    case "text":
    case "textarea": {
      if (typeof answer !== "string") {
        return "Expected a text value";
      }
      if (question.maxLength && answer.length > question.maxLength) {
        return `Response must be ${question.maxLength} characters or fewer`;
      }
      return null;
    }

    case "select": {
      if (typeof answer !== "string") {
        return "Expected a single selection";
      }
      if (question.options && !question.allowOther) {
        const validValues = question.options.map((o) => o.value);
        if (!validValues.includes(answer)) {
          return "Invalid selection";
        }
      }
      return null;
    }

    case "multi_select": {
      if (!Array.isArray(answer)) {
        return "Expected multiple selections";
      }
      if (question.options && !question.allowOther) {
        const validValues = question.options.map((o) => o.value);
        for (const val of answer) {
          if (!validValues.includes(val)) {
            return `Invalid selection: ${val}`;
          }
        }
      }
      return null;
    }

    case "file_upload": {
      // File uploads are tracked as string arrays of URLs
      if (!Array.isArray(answer)) {
        return "Expected file upload values";
      }
      if (question.maxFiles && answer.length > question.maxFiles) {
        return `Maximum ${question.maxFiles} file(s) allowed`;
      }
      return null;
    }

    case "yes_no": {
      if (typeof answer !== "boolean") {
        return "Expected yes or no";
      }
      return null;
    }

    case "color_picker":
    case "color_confirm": {
      if (typeof answer !== "string") {
        return "Expected a color value";
      }
      // Basic hex color validation
      if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(answer)) {
        return "Invalid color format. Use hex format (e.g. #FF0000)";
      }
      return null;
    }

    case "address": {
      if (typeof answer !== "object" || Array.isArray(answer)) {
        return "Expected an address";
      }
      const addr = answer as AddressValue;
      if (question.required) {
        if (!addr.street?.trim()) return "Street is required";
        if (!addr.city?.trim()) return "City is required";
        if (!addr.state?.trim()) return "State is required";
        if (!addr.zip?.trim()) return "ZIP code is required";
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Returns the default empty value for a given question type.
 */
export function getDefaultValue(type: QuestionConfig["type"]): AnswerValue {
  switch (type) {
    case "text":
    case "textarea":
    case "select":
    case "color_picker":
    case "color_confirm":
      return "";

    case "multi_select":
    case "file_upload":
      return [];

    case "yes_no":
      return null;

    case "address":
      return { street: "", city: "", state: "", zip: "" };

    default:
      return null;
  }
}

/**
 * Determines if a question has been completed (has a meaningful answer).
 */
export function isQuestionComplete(
  question: QuestionConfig,
  answer: AnswerValue
): boolean {
  if (answer === null || answer === undefined) {
    return false;
  }

  switch (question.type) {
    case "text":
    case "textarea":
    case "select":
    case "color_picker":
    case "color_confirm":
      return typeof answer === "string" && answer.trim() !== "";

    case "multi_select":
    case "file_upload":
      return Array.isArray(answer) && answer.length > 0;

    case "yes_no":
      return typeof answer === "boolean";

    case "address": {
      if (typeof answer !== "object" || Array.isArray(answer)) return false;
      const addr = answer as AddressValue;
      return !!(
        addr.street?.trim() &&
        addr.city?.trim() &&
        addr.state?.trim() &&
        addr.zip?.trim()
      );
    }

    default:
      return false;
  }
}
