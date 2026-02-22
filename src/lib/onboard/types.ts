export type QuestionType =
  | "text"
  | "textarea"
  | "select"
  | "multi_select"
  | "file_upload"
  | "yes_no"
  | "yes_no_na"
  | "color_picker"
  | "color_confirm"
  | "brand_colors"
  | "tag_input"
  | "address"
  | "team_members"
  | "project_gallery";

export interface QuestionOption {
  label: string;
  value: string;
}

export interface DetectedColor {
  hex: string;
  label: string;
  source?: string;
}

export interface QuestionConfig {
  id: string;
  type: QuestionType;
  question: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  options?: QuestionOption[];
  allowOther?: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
  detectedColors?: DetectedColor[];
  maxLength?: number;
  detailsPrompt?: string;
  minTags?: number;
  maxTags?: number;
  suggestions?: string[];
  detectedTheme?: "light" | "dark";
}

export interface OnboardConfig {
  id: string;
  client_slug: string;
  client_name: string;
  business_name: string;
  config: {
    questions: QuestionConfig[];
    branding?: {
      primaryColor?: string;
      logoUrl?: string;
    };
    welcome?: {
      title?: string;
      subtitle?: string;
    };
    completion?: {
      title?: string;
      message?: string;
    };
  };
  status: "draft" | "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface AddressValue {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface YesNoNAValue {
  answer: "yes" | "no" | "na";
  details?: string;
}

export interface TeamMember {
  name: string;
  bio: string;
  photoUrl?: string;
}

export interface ProjectEntry {
  title: string;
  beforePhotos: string[];
  afterPhotos: string[];
}

export interface ProjectGalleryValue {
  projects: ProjectEntry[];
  photos: string[];
}

export interface BrandColorsValue {
  theme: "light" | "dark" | null;
  keptColors: string[];
  customColors: string[];
  description: string;
}

export type AnswerValue =
  | string
  | string[]
  | boolean
  | AddressValue
  | YesNoNAValue
  | TeamMember[]
  | ProjectGalleryValue
  | BrandColorsValue
  | null;

export interface OnboardSubmission {
  id: string;
  config_id: string;
  client_slug: string;
  answers: Record<string, AnswerValue>;
  file_urls: Record<string, string[]>;
  status: "in_progress" | "submitted";
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Props interface for question components
export interface QuestionProps {
  question: QuestionConfig;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  onNext: () => void;
  onFileUpload?: (
    slug: string,
    questionId: string,
    file: File
  ) => Promise<string>;
  slug?: string;
}
