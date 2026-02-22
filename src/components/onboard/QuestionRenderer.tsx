"use client";

import type { QuestionProps } from "@/lib/onboard/types";
import { TextQuestion } from "./TextQuestion";
import { TextareaQuestion } from "./TextareaQuestion";
import { SelectQuestion } from "./SelectQuestion";
import { MultiSelectQuestion } from "./MultiSelectQuestion";
import { FileUploadQuestion } from "./FileUploadQuestion";
import { YesNoQuestion } from "./YesNoQuestion";
import { YesNoNAQuestion } from "./YesNoNAQuestion";
import { ColorPickerQuestion } from "./ColorPickerQuestion";
import { ColorConfirmQuestion } from "./ColorConfirmQuestion";
import { AddressQuestion } from "./AddressQuestion";
import { TeamMembersQuestion } from "./TeamMembersQuestion";
import { ProjectGalleryQuestion } from "./ProjectGalleryQuestion";

const QUESTION_COMPONENTS: Record<
  string,
  React.ComponentType<QuestionProps>
> = {
  text: TextQuestion,
  textarea: TextareaQuestion,
  select: SelectQuestion,
  multi_select: MultiSelectQuestion,
  file_upload: FileUploadQuestion,
  yes_no: YesNoQuestion,
  yes_no_na: YesNoNAQuestion,
  color_picker: ColorPickerQuestion,
  color_confirm: ColorConfirmQuestion,
  address: AddressQuestion,
  team_members: TeamMembersQuestion,
  project_gallery: ProjectGalleryQuestion,
};

export function QuestionRenderer(props: QuestionProps) {
  const { question } = props;
  const Component = QUESTION_COMPONENTS[question.type];

  if (!Component) {
    return (
      <p className="text-text-muted">
        Unknown question type: {question.type}
      </p>
    );
  }

  return <Component {...props} />;
}
