"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Spinner } from "@/components/ui";
import { ProgressBar } from "@/components/onboard/ProgressBar";
import { TransitionWrapper } from "@/components/onboard/TransitionWrapper";
import { QuestionRenderer } from "@/components/onboard/QuestionRenderer";
import { isQuestionComplete } from "@/lib/onboard/question-types";
import type {
  OnboardConfig,
  OnboardSubmission,
  AnswerValue,
  AddressValue,
  YesNoNAValue,
  TeamMember,
  ProjectGalleryValue,
  QuestionConfig,
} from "@/lib/onboard/types";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

type Screen = "welcome" | "questions" | "review" | "submitted";

interface OnboardFormProps {
  config: OnboardConfig;
  existingSubmission: OnboardSubmission | null;
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function getLocalStorageKey(slug: string) {
  return `onboard_answers_${slug}`;
}

function loadSavedAnswers(slug: string): Record<string, AnswerValue> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getLocalStorageKey(slug));
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return {};
}

function saveAnswers(slug: string, answers: Record<string, AnswerValue>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getLocalStorageKey(slug), JSON.stringify(answers));
  } catch {
    // ignore quota errors
  }
}

function clearSavedAnswers(slug: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getLocalStorageKey(slug));
}

function formatAnswerForReview(
  question: QuestionConfig,
  answer: AnswerValue
): string {
  if (answer === null || answer === undefined) {
    return question.required ? "Not answered" : "Skipped";
  }

  switch (question.type) {
    case "text":
    case "textarea":
    case "select":
      return typeof answer === "string" && answer.trim() ? answer : "Skipped";
    case "multi_select":
      return Array.isArray(answer) && answer.length > 0
        ? answer.join(", ")
        : "Skipped";
    case "yes_no":
      return typeof answer === "boolean" ? (answer ? "Yes" : "No") : "Skipped";
    case "yes_no_na": {
      if (typeof answer === "object" && !Array.isArray(answer) && "answer" in answer) {
        const val = answer as YesNoNAValue;
        const label = val.answer === "yes" ? "Yes" : val.answer === "no" ? "No" : "N/A";
        return val.details ? `${label} — ${val.details}` : label;
      }
      return "Skipped";
    }
    case "color_picker":
    case "color_confirm":
      return typeof answer === "string" && answer.trim() ? answer : "Skipped";
    case "file_upload":
      return Array.isArray(answer) && answer.length > 0
        ? `${answer.length} file(s)`
        : "Skipped";
    case "address": {
      if (typeof answer === "object" && !Array.isArray(answer)) {
        const addr = answer as AddressValue;
        const parts = [addr.street, addr.city, addr.state, addr.zip].filter(
          (p) => p?.trim()
        );
        return parts.length > 0 ? parts.join(", ") : "Skipped";
      }
      return "Skipped";
    }
    case "team_members": {
      if (Array.isArray(answer) && answer.length > 0) {
        return `${(answer as TeamMember[]).length} member(s)`;
      }
      return "Skipped";
    }
    case "project_gallery": {
      if (typeof answer === "object" && !Array.isArray(answer) && "projects" in answer) {
        const val = answer as ProjectGalleryValue;
        const parts: string[] = [];
        if (val.projects.length > 0) parts.push(`${val.projects.length} project(s)`);
        if (val.photos.length > 0) parts.push(`${val.photos.length} photo(s)`);
        return parts.length > 0 ? parts.join(", ") : "Skipped";
      }
      return "Skipped";
    }
    default:
      return String(answer);
  }
}

// ════════════════════════════════════════════════════════════
// MAIN FORM COMPONENT
// ════════════════════════════════════════════════════════════

export function OnboardForm({ config, existingSubmission }: OnboardFormProps) {
  const questions = config.config.questions;
  const slug = config.client_slug;

  const initialScreen: Screen = existingSubmission?.status === "submitted"
    ? "submitted"
    : "welcome";

  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [fileUrls, setFileUrls] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initialized = useRef(false);

  // Load saved answers on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (existingSubmission && existingSubmission.status !== "submitted") {
      setAnswers(existingSubmission.answers ?? {});
      setFileUrls(existingSubmission.file_urls ?? {});
    } else if (existingSubmission?.status !== "submitted") {
      const saved = loadSavedAnswers(slug);
      if (Object.keys(saved).length > 0) {
        setAnswers(saved);
      }
    }
  }, [slug, existingSubmission]);

  // Auto-save answers to localStorage
  useEffect(() => {
    if (screen === "submitted") return;
    saveAnswers(slug, answers);
  }, [answers, slug, screen]);

  // Navigation helpers
  const goNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setScreen("review");
    }
  }, [currentIndex, questions.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (screen !== "questions") return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentQ = questions[currentIndex];

      if (e.key === "Enter" && currentQ?.type !== "textarea") {
        e.preventDefault();
        goNext();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        goPrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, currentIndex, questions, goNext, goPrev]);

  function goToQuestion(idx: number) {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
    setScreen("questions");
  }

  function updateAnswer(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  // File upload handler — sends JSON to get signed URL, then PUTs file
  async function handleFileUpload(
    clientSlug: string,
    questionId: string,
    file: File
  ): Promise<string> {
    // Step 1: Get signed upload URL
    const res = await fetch("/api/onboard/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: clientSlug,
        questionId,
        filename: file.name,
        contentType: file.type,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to get upload URL");
    }

    const { signedUrl, publicUrl } = await res.json();

    // Step 2: Upload file to signed URL
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) {
      throw new Error("File upload failed");
    }

    // Track file URLs for submission
    setFileUrls((prev) => ({
      ...prev,
      [questionId]: [...(prev[questionId] ?? []), publicUrl],
    }));

    return publicUrl;
  }

  // Submit handler
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/onboard/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          file_urls: fileUrls,
          status: "submitted",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Submission failed");
      }

      clearSavedAnswers(slug);
      setScreen("submitted");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  // Progress calculation
  const progressPercent =
    screen === "welcome"
      ? 0
      : screen === "submitted"
        ? 100
        : screen === "review"
          ? 95
          : Math.round(((currentIndex + 1) / questions.length) * 90);

  const currentQuestion = questions[currentIndex];
  const isOptional = currentQuestion && !currentQuestion.required;

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProgressBar percent={progressPercent} />

      <AnimatePresence mode="wait">
        {/* ─── WELCOME SCREEN ─── */}
        {screen === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex items-center justify-center px-6"
          >
            <div className="max-w-xl w-full text-center">
              {config.config.branding?.logoUrl && (
                <div className="mb-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={config.config.branding.logoUrl}
                    alt={config.business_name}
                    className="h-16 mx-auto"
                  />
                </div>
              )}
              <h1 className="font-serif text-4xl md:text-5xl text-text-primary leading-tight mb-4">
                {config.config.welcome?.title ?? `Welcome, ${config.client_name}`}
              </h1>
              <p className="text-lg text-text-muted mb-10 leading-relaxed max-w-md mx-auto">
                {config.config.welcome?.subtitle ??
                  "We have a few questions to help us get started on your project. This should only take a few minutes."}
              </p>
              <Button
                onClick={() => setScreen("questions")}
                className="!px-8 !py-4 !text-base"
              >
                Get Started
                <svg
                  className="w-5 h-5 ml-2 inline-block"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>
              <p className="mt-6 text-sm text-text-dim">
                {questions.length} questions &middot; ~{Math.max(2, Math.ceil(questions.length * 0.5))} min
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── QUESTIONS SCREEN ─── */}
        {screen === "questions" && currentQuestion && (
          <motion.div
            key="questions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Question content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
              <div className="max-w-xl w-full">
                <TransitionWrapper
                  direction={direction}
                  currentKey={currentIndex}
                >
                  <div>
                    {/* Question counter + optional badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-sm text-accent font-medium">
                        {currentIndex + 1}{" "}
                        <span className="text-text-dim">/ {questions.length}</span>
                      </p>
                      {isOptional && (
                        <span className="text-xs text-text-dim bg-surface border border-border rounded-full px-2 py-0.5">
                          Optional
                        </span>
                      )}
                    </div>

                    {/* Question text */}
                    <h2 className="font-serif text-2xl md:text-3xl text-text-primary leading-tight mb-2">
                      {currentQuestion.question}
                    </h2>

                    {/* Description */}
                    {currentQuestion.description && (
                      <p className="text-text-muted mb-6">
                        {currentQuestion.description}
                      </p>
                    )}

                    {/* Question input */}
                    <div className="mt-6">
                      <QuestionRenderer
                        question={currentQuestion}
                        value={answers[currentQuestion.id] ?? null}
                        onChange={(val) => updateAnswer(currentQuestion.id, val)}
                        onNext={goNext}
                        onFileUpload={handleFileUpload}
                        slug={slug}
                      />
                    </div>

                    {/* Skip button for optional questions */}
                    {isOptional && !isQuestionComplete(currentQuestion, answers[currentQuestion.id] ?? null) && (
                      <div className="mt-4 text-center">
                        <button
                          type="button"
                          onClick={goNext}
                          className="text-sm text-text-dim hover:text-text-muted transition-colors"
                        >
                          Skip this question →
                        </button>
                      </div>
                    )}
                  </div>
                </TransitionWrapper>
              </div>
            </div>

            {/* Navigation footer */}
            <footer className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border px-6 py-4">
              <div className="max-w-xl mx-auto flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </Button>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {questions.map((q, idx) => {
                    const complete = isQuestionComplete(q, answers[q.id] ?? null);
                    const isCurrent = idx === currentIndex;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => goToQuestion(idx)}
                        className={`
                          w-2 h-2 rounded-full transition-all
                          ${isCurrent ? "w-4 bg-accent" : complete ? "bg-green-500" : "bg-border"}
                        `}
                        aria-label={`Go to question ${idx + 1}`}
                      />
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  onClick={goNext}
                >
                  {currentIndex === questions.length - 1 ? "Review" : "Next"}
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Button>
              </div>
            </footer>
          </motion.div>
        )}

        {/* ─── REVIEW SCREEN ─── */}
        {screen === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex-1 px-6 py-12"
          >
            <div className="max-w-xl mx-auto">
              <h2 className="font-serif text-3xl md:text-4xl text-text-primary mb-2">
                Almost done!
              </h2>
              <p className="text-text-muted mb-8">
                Quick look at your answers. Tap any to change it.
              </p>

              <div className="space-y-3">
                {questions.map((q, idx) => {
                  const answer = answers[q.id] ?? null;
                  const complete = isQuestionComplete(q, answer);
                  const reviewText = formatAnswerForReview(q, answer);

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => goToQuestion(idx)}
                      className="w-full text-left bg-surface border border-border rounded-lg px-4 py-3 hover:border-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        {/* Status indicator */}
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          complete ? "bg-green-500/20" : "bg-border"
                        }`}>
                          {complete ? (
                            <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-text-dim" />
                          )}
                        </div>

                        {/* Question + answer */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary font-medium truncate">
                            {q.question}
                          </p>
                          {/* Color swatch for color questions */}
                          {(q.type === "color_picker" || q.type === "color_confirm") && typeof answer === "string" && answer ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div
                                className="w-3.5 h-3.5 rounded border border-white/20"
                                style={{ backgroundColor: answer }}
                              />
                              <span className="text-xs text-text-dim font-mono">{answer}</span>
                            </div>
                          ) : (
                            <p className={`text-xs mt-0.5 truncate ${complete ? "text-text-muted" : "text-text-dim italic"}`}>
                              {reviewText}
                            </p>
                          )}
                        </div>

                        {/* Edit arrow */}
                        <svg className="w-4 h-4 text-text-dim group-hover:text-accent transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>

              {submitError && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              <div className="mt-8 flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDirection(-1);
                    setCurrentIndex(questions.length - 1);
                    setScreen("questions");
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 !py-4"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" />
                      Submitting...
                    </span>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── SUBMITTED SCREEN ─── */}
        {screen === "submitted" && (
          <motion.div
            key="submitted"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex items-center justify-center px-6"
          >
            <div className="max-w-md w-full text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-text-primary mb-3">
                {config.config.completion?.title ?? "Thank you!"}
              </h2>
              <p className="text-text-muted leading-relaxed">
                {config.config.completion?.message ??
                  `Your responses have been submitted successfully. We'll review everything and be in touch soon.`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
