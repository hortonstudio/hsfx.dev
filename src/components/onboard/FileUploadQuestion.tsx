"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button, Spinner } from "@/components/ui";
import type { QuestionProps } from "@/lib/onboard/types";

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
  "image/avif",
];

const ACCEPTED_LABEL = "PNG, JPG, SVG, WebP, or AVIF";

/**
 * Compresses an image file by resizing it and converting to AVIF (with WebP fallback).
 * SVGs are returned unchanged. If any error occurs, the original file is returned.
 */
async function compressImage(file: File, maxWidth = 1000): Promise<File> {
  if (file.type === "image/svg+xml") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    // Only downscale, never upscale
    let targetWidth = width;
    let targetHeight = height;
    if (width > maxWidth) {
      targetWidth = maxWidth;
      targetHeight = Math.round((height / width) * maxWidth);
    }

    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    // Try AVIF first, fall back to WebP
    let blob: Blob;
    try {
      blob = await canvas.convertToBlob({ type: "image/avif", quality: 0.8 });
      if (blob.type !== "image/avif") throw new Error("AVIF not supported");
    } catch {
      blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.8 });
    }

    const ext = blob.type === "image/avif" ? ".avif" : ".webp";
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}${ext}`, { type: blob.type });
  } catch {
    return file;
  }
}

interface UploadedFile {
  name: string;
  url: string;
  previewUrl: string;
  uploading: boolean;
}

export function FileUploadQuestion({
  question,
  value,
  onChange,
  onNext,
  onFileUpload,
  slug,
}: QuestionProps) {
  const [files, setFiles] = useState<UploadedFile[]>(() => {
    if (Array.isArray(value)) {
      return (value as string[]).map((url) => ({
        name: url.split("/").pop() ?? "file",
        url,
        previewUrl: url,
        uploading: false,
      }));
    }
    return [];
  });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxFiles = question.maxFiles ?? 10;

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(f.previewUrl);
        }
      });
    };
    // Only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      if (!onFileUpload || !slug) return;

      const remaining = maxFiles - files.length;
      const toUpload = Array.from(fileList).slice(0, remaining);
      if (toUpload.length === 0) return;

      // Create placeholder entries with local previews
      const placeholders: UploadedFile[] = toUpload.map((file) => ({
        name: file.name,
        url: "",
        previewUrl: URL.createObjectURL(file),
        uploading: true,
      }));

      const updatedWithPlaceholders = [...files, ...placeholders];
      setFiles(updatedWithPlaceholders);

      // Upload each file (with compression) and update in place
      const results = [...updatedWithPlaceholders];
      const startIndex = files.length;

      for (let i = 0; i < toUpload.length; i++) {
        try {
          const compressed = await compressImage(toUpload[i]);
          const url = await onFileUpload(slug, question.id, compressed);
          results[startIndex + i] = {
            ...results[startIndex + i],
            url,
            uploading: false,
          };
        } catch {
          // Upload failed - remove the placeholder
          results[startIndex + i] = {
            ...results[startIndex + i],
            url: "",
            uploading: false,
          };
        }
      }

      // Filter out any that failed (empty url and not uploading)
      const final = results.filter((f) => f.url !== "" || f.uploading);
      setFiles(final);
      onChange(final.map((f) => f.url).filter(Boolean));
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
    const removed = files[index];
    if (removed.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onChange(updated.map((f) => f.url).filter(Boolean));
  };

  const hasUploading = files.some((f) => f.uploading);
  const canUploadMore = files.length < maxFiles;

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      {canUploadMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={hasUploading}
          className={`
            w-full py-10 px-6 rounded-xl
            border-2 border-dashed
            flex flex-col items-center justify-center gap-3
            transition-all duration-200 cursor-pointer
            min-h-[48px]
            ${
              dragOver
                ? "border-accent bg-accent/10"
                : "border-border bg-surface hover:border-accent/50"
            }
            ${hasUploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-text-primary text-lg font-medium text-center">
            Drop images here or tap to browse
          </p>
          <p className="text-text-dim text-sm text-center">{ACCEPTED_LABEL}</p>
          <p className="text-text-dim text-sm text-center">
            Up to {maxFiles} images
            {files.length > 0 && ` (${files.length} added)`}
          </p>
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={maxFiles > 1}
        accept={ACCEPTED_TYPES.join(",")}
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {/* Thumbnail grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-surface"
            >
              {/* Image preview */}
              <img
                src={file.url || file.previewUrl}
                alt={file.name}
                className="w-full h-full object-cover"
              />

              {/* Upload loading overlay */}
              {file.uploading && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                  <Spinner size="md" />
                </div>
              )}

              {/* Remove button */}
              {!file.uploading && (
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="
                    absolute top-1.5 right-1.5
                    w-7 h-7 rounded-full
                    bg-background/80 backdrop-blur-sm
                    border border-border
                    flex items-center justify-center
                    text-text-muted hover:text-red-500 hover:border-red-500/50
                    transition-all duration-150
                    opacity-0 group-hover:opacity-100
                    sm:opacity-0 sm:group-hover:opacity-100
                    max-sm:opacity-100
                    cursor-pointer
                  "
                  aria-label={`Remove ${file.name}`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}

              {/* File name tooltip on hover */}
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-background/80 backdrop-blur-sm text-xs text-text-muted truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Continue / Skip actions */}
      <div className="flex items-center justify-between pt-2">
        {!question.required ? (
          <button
            type="button"
            onClick={onNext}
            className="text-text-dim hover:text-text-muted text-sm transition-colors cursor-pointer"
          >
            Skip this question
          </button>
        ) : (
          <div />
        )}
        {files.length > 0 && (
          <Button onClick={onNext} size="md" disabled={hasUploading}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
