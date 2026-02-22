"use client";

import { useState, useRef, useCallback } from "react";
import { Button, Spinner } from "@/components/ui";
import type { QuestionProps } from "@/lib/onboard/types";

interface UploadedFile {
  name: string;
  url: string;
}

export function FileUploadQuestion({
  question,
  value,
  onChange,
  onNext,
  onFileUpload,
  slug,
}: QuestionProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>(() => {
    if (Array.isArray(value)) {
      return (value as string[]).map((url) => ({
        name: url.split("/").pop() ?? "file",
        url,
      }));
    }
    return [];
  });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxFiles = question.maxFiles ?? 1;
  const acceptedTypes = question.acceptedTypes ?? [];

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      if (!onFileUpload || !slug) return;

      const remaining = maxFiles - files.length;
      const toUpload = Array.from(fileList).slice(0, remaining);
      if (toUpload.length === 0) return;

      setUploading(true);
      const newFiles: UploadedFile[] = [];

      for (const file of toUpload) {
        try {
          const url = await onFileUpload(slug, question.id, file);
          newFiles.push({ name: file.name, url });
        } catch {
          // Upload failed silently; parent handles error reporting
        }
      }

      const updated = [...files, ...newFiles];
      setFiles(updated);
      onChange(updated.map((f) => f.url));
      setUploading(false);
    },
    [files, maxFiles, onFileUpload, slug, question.id, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onChange(updated.map((f) => f.url));
  };

  return (
    <div className="space-y-4">
      {files.length < maxFiles && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={`
            w-full py-12 px-6 rounded-xl
            border-2 border-dashed
            flex flex-col items-center justify-center gap-3
            transition-all duration-200 cursor-pointer
            min-h-[48px]
            ${
              dragOver
                ? "border-accent bg-accent/10"
                : "border-border bg-surface hover:border-accent/50"
            }
            ${uploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {uploading ? (
            <Spinner size="lg" />
          ) : (
            <>
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-muted"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-text-primary text-lg font-medium">
                Drop files here or click to browse
              </p>
              {acceptedTypes.length > 0 && (
                <p className="text-text-dim text-sm">
                  Accepted: {acceptedTypes.join(", ")}
                </p>
              )}
              {maxFiles > 1 && (
                <p className="text-text-dim text-sm">
                  Up to {maxFiles} files ({files.length} uploaded)
                </p>
              )}
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={maxFiles > 1}
        accept={acceptedTypes.length > 0 ? acceptedTypes.join(",") : undefined}
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={file.url}
              className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-lg"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent flex-shrink-0"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="flex-1 text-text-primary text-sm truncate">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-text-dim hover:text-red-500 transition-colors cursor-pointer"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={onNext} size="md">
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
