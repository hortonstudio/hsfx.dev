import type {
  QuestionConfig,
  AnswerValue,
  AddressValue,
  YesNoNAValue,
  TeamMember,
  ProjectGalleryValue,
  BrandColorsValue,
} from "./types";

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
        for (const val of answer as string[]) {
          if (!validValues.includes(val)) {
            return `Invalid selection: ${val}`;
          }
        }
      }
      return null;
    }

    case "file_upload": {
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

    case "yes_no_na": {
      if (typeof answer !== "object" || Array.isArray(answer)) {
        return "Expected a yes/no/na value";
      }
      const val = answer as YesNoNAValue;
      if (!["yes", "no", "na"].includes(val.answer)) {
        return "Expected yes, no, or not applicable";
      }
      return null;
    }

    case "color_picker":
    case "color_confirm": {
      if (typeof answer !== "string") {
        return "Expected a color value";
      }
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

    case "team_members": {
      if (!Array.isArray(answer)) {
        return "Expected team member entries";
      }
      const members = answer as TeamMember[];
      for (const m of members) {
        if (!m.name?.trim()) return "Each team member needs a name";
      }
      return null;
    }

    case "project_gallery": {
      if (typeof answer !== "object" || Array.isArray(answer)) {
        return "Expected project gallery data";
      }
      return null;
    }

    case "brand_colors": {
      if (typeof answer !== "object" || Array.isArray(answer)) {
        return "Expected brand colors data";
      }
      return null;
    }

    case "tag_input": {
      if (!Array.isArray(answer)) {
        return "Expected tag values";
      }
      const tags = answer as string[];
      if (question.minTags !== undefined && tags.length < question.minTags) {
        return `Please add at least ${question.minTags} item(s)`;
      }
      if (question.maxTags !== undefined && tags.length > question.maxTags) {
        return `Maximum ${question.maxTags} item(s) allowed`;
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

    case "yes_no_na":
      return null;

    case "address":
      return { street: "", city: "", state: "", zip: "" };

    case "team_members":
      return [];

    case "project_gallery":
      return { projects: [], photos: [] };

    case "brand_colors":
      return { theme: null, keptColors: [], customColors: [], description: "" };

    case "tag_input":
      return [];

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

    case "yes_no_na": {
      if (typeof answer !== "object" || Array.isArray(answer)) return false;
      const val = answer as YesNoNAValue;
      return ["yes", "no", "na"].includes(val.answer);
    }

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

    case "team_members": {
      if (!Array.isArray(answer)) return false;
      return (answer as TeamMember[]).length > 0;
    }

    case "project_gallery": {
      if (typeof answer !== "object" || Array.isArray(answer)) return false;
      const val = answer as ProjectGalleryValue;
      return val.projects.length > 0 || val.photos.length > 0;
    }

    case "brand_colors": {
      if (typeof answer !== "object" || Array.isArray(answer)) return false;
      const val = answer as BrandColorsValue;
      return val.theme !== null;
    }

    case "tag_input": {
      if (!Array.isArray(answer)) return false;
      return answer.length > 0;
    }

    default:
      return false;
  }
}
