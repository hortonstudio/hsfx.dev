"use client";

import type { QuestionProps } from "@/lib/onboard/types";
import { TextQuestion } from "./TextQuestion";
import { TextareaQuestion } from "./TextareaQuestion";
import { SelectQuestion } from "./SelectQuestion";
import { MultiSelectQuestion } from "./MultiSelectQuestion";
import { FileUploadQuestion } from "./FileUploadQuestion";
import { YesNoQuestion } from "./YesNoQuestion";
import { ColorPickerQuestion } from "./ColorPickerQuestion";
import { ColorConfirmQuestion } from "./ColorConfirmQuestion";
import { AddressQuestion } from "./AddressQuestion";

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
  color_picker: ColorPickerQuestion,
  color_confirm: ColorConfirmQuestion,
  address: AddressQuestion,
};

export function QuestionRenderer(props: QuestionProps) {
  const { question } = props;
  const Component = QUESTION_COMPONENTS[question.type];

  if (!Component) {
    return (
      <div className="max-w-2xl mx-auto px-6">
        <p className="text-text-muted">
          Unknown question type: {question.type}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6">
      <h2 className="font-serif text-3xl md:text-4xl text-text-primary mb-3 leading-tight">
        {question.question}
      </h2>
      {question.description && (
        <p className="text-text-muted text-lg mb-8">{question.description}</p>
      )}
      <Component {...props} />
    </div>
  );
}
