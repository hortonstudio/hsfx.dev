"use client";

import { useState, useRef, useCallback } from "react";
import { Input, Button, Spinner } from "@/components/ui";
import type {
  QuestionProps,
  ProjectGalleryValue,
  ProjectEntry,
} from "@/lib/onboard/types";

type GalleryMode = "before_after" | "gallery";

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/avif";
const MAX_GALLERY_PHOTOS = 20;

const EMPTY_VALUE: ProjectGalleryValue = {
  projects: [],
  photos: [],
};

function parseValue(value: unknown): ProjectGalleryValue {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "projects" in value
  ) {
    return value as ProjectGalleryValue;
  }
  return EMPTY_VALUE;
}

export function ProjectGalleryQuestion({
  question,
  value,
  onChange,
  onNext,
  onFileUpload,
  slug,
}: QuestionProps) {
  const gallery = parseValue(value);
  const [mode, setMode] = useState<GalleryMode>(
    gallery.projects.length > 0 ? "before_after" : "before_after"
  );
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const afterInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const update = useCallback(
    (next: ProjectGalleryValue) => {
      onChange(next);
    },
    [onChange]
  );

  // -- Before & After helpers --

  const addProject = () => {
    const newProject: ProjectEntry = {
      title: "",
      beforePhotos: [],
      afterPhotos: [],
    };
    update({ ...gallery, projects: [...gallery.projects, newProject] });
  };

  const removeProject = (index: number) => {
    const updated = gallery.projects.filter((_, i) => i !== index);
    update({ ...gallery, projects: updated });
  };

  const updateProjectTitle = (index: number, title: string) => {
    const updated = gallery.projects.map((p, i) =>
      i === index ? { ...p, title } : p
    );
    update({ ...gallery, projects: updated });
  };

  const handleProjectPhotos = useCallback(
    async (
      projectIndex: number,
      side: "before" | "after",
      files: FileList
    ) => {
      if (!onFileUpload || !slug || files.length === 0) return;
      setUploading(`${side}-${projectIndex}`);
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        try {
          const url = await onFileUpload(slug, question.id, file);
          newUrls.push(url);
        } catch {
          // Upload failed silently
        }
      }
      if (newUrls.length > 0) {
        const updated = gallery.projects.map((p, i) => {
          if (i !== projectIndex) return p;
          if (side === "before") {
            return { ...p, beforePhotos: [...p.beforePhotos, ...newUrls] };
          }
          return { ...p, afterPhotos: [...p.afterPhotos, ...newUrls] };
        });
        update({ ...gallery, projects: updated });
      }
      setUploading(null);
    },
    [onFileUpload, slug, question.id, gallery, update]
  );

  const removeProjectPhoto = (
    projectIndex: number,
    side: "before" | "after",
    photoIndex: number
  ) => {
    const updated = gallery.projects.map((p, i) => {
      if (i !== projectIndex) return p;
      if (side === "before") {
        return {
          ...p,
          beforePhotos: p.beforePhotos.filter((_, pi) => pi !== photoIndex),
        };
      }
      return {
        ...p,
        afterPhotos: p.afterPhotos.filter((_, pi) => pi !== photoIndex),
      };
    });
    update({ ...gallery, projects: updated });
  };

  // -- Gallery helpers --

  const handleGalleryFiles = useCallback(
    async (fileList: FileList) => {
      if (!onFileUpload || !slug) return;
      const remaining = MAX_GALLERY_PHOTOS - gallery.photos.length;
      const toUpload = Array.from(fileList).slice(0, remaining);
      if (toUpload.length === 0) return;

      setUploading("gallery");
      const newUrls: string[] = [];
      for (const file of toUpload) {
        try {
          const url = await onFileUpload(slug, question.id, file);
          newUrls.push(url);
        } catch {
          // Upload failed silently
        }
      }
      update({ ...gallery, photos: [...gallery.photos, ...newUrls] });
      setUploading(null);
    },
    [onFileUpload, slug, question.id, gallery, update]
  );

  const handleGalleryDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleGalleryFiles(e.dataTransfer.files);
      }
    },
    [handleGalleryFiles]
  );

  const removeGalleryPhoto = (index: number) => {
    const updated = gallery.photos.filter((_, i) => i !== index);
    update({ ...gallery, photos: updated });
  };

  const hasContent =
    gallery.projects.length > 0 || gallery.photos.length > 0;

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode("before_after")}
          className={`
            py-4 rounded-xl text-base font-medium
            border-2 transition-all duration-200
            min-h-[48px] cursor-pointer
            ${
              mode === "before_after"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface hover:border-accent/50 text-text-primary"
            }
          `}
        >
          Before &amp; After
        </button>
        <button
          type="button"
          onClick={() => setMode("gallery")}
          className={`
            py-4 rounded-xl text-base font-medium
            border-2 transition-all duration-200
            min-h-[48px] cursor-pointer
            ${
              mode === "gallery"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface hover:border-accent/50 text-text-primary"
            }
          `}
        >
          Photo Gallery
        </button>
      </div>

      {/* Before & After mode */}
      {mode === "before_after" && (
        <div className="space-y-4">
          {gallery.projects.map((project, projectIndex) => (
            <div
              key={projectIndex}
              className="border-2 border-border rounded-xl p-4 space-y-3 bg-surface relative"
            >
              {/* Remove project button */}
              <button
                type="button"
                onClick={() => removeProject(projectIndex)}
                className="absolute top-3 right-3 p-1.5 text-text-dim hover:text-red-500 transition-colors cursor-pointer"
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

              {/* Project title */}
              <Input
                value={project.title}
                onChange={(e) =>
                  updateProjectTitle(projectIndex, e.target.value)
                }
                placeholder="Project name (optional)"
                className="!text-base !py-2.5 pr-10"
              />

              {/* Before / After upload areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Before */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-text-muted">Before</p>
                  {project.beforePhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {project.beforePhotos.map((url, photoIndex) => (
                        <div
                          key={url}
                          className="relative aspect-square rounded-lg overflow-hidden bg-background border border-border"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Before ${photoIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              removeProjectPhoto(
                                projectIndex,
                                "before",
                                photoIndex
                              )
                            }
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors cursor-pointer"
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
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
                  <button
                    type="button"
                    onClick={() => {
                      const input = beforeInputRefs.current.get(projectIndex);
                      input?.click();
                    }}
                    disabled={uploading === `before-${projectIndex}`}
                    className="w-full py-6 rounded-lg border-2 border-dashed border-border hover:border-accent/50 flex flex-col items-center gap-1.5 transition-colors cursor-pointer text-text-muted min-h-[48px]"
                  >
                    {uploading === `before-${projectIndex}` ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-text-dim"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span className="text-sm">Add before photos</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={(el) => {
                      if (el) beforeInputRefs.current.set(projectIndex, el);
                    }}
                    type="file"
                    multiple
                    className="hidden"
                    accept={ACCEPTED_IMAGE_TYPES}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleProjectPhotos(projectIndex, "before", e.target.files);
                        e.target.value = "";
                      }
                    }}
                  />
                </div>

                {/* After */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-text-muted">After</p>
                  {project.afterPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {project.afterPhotos.map((url, photoIndex) => (
                        <div
                          key={url}
                          className="relative aspect-square rounded-lg overflow-hidden bg-background border border-border"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`After ${photoIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              removeProjectPhoto(
                                projectIndex,
                                "after",
                                photoIndex
                              )
                            }
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors cursor-pointer"
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
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
                  <button
                    type="button"
                    onClick={() => {
                      const input = afterInputRefs.current.get(projectIndex);
                      input?.click();
                    }}
                    disabled={uploading === `after-${projectIndex}`}
                    className="w-full py-6 rounded-lg border-2 border-dashed border-border hover:border-accent/50 flex flex-col items-center gap-1.5 transition-colors cursor-pointer text-text-muted min-h-[48px]"
                  >
                    {uploading === `after-${projectIndex}` ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-text-dim"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span className="text-sm">Add after photos</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={(el) => {
                      if (el) afterInputRefs.current.set(projectIndex, el);
                    }}
                    type="file"
                    multiple
                    className="hidden"
                    accept={ACCEPTED_IMAGE_TYPES}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleProjectPhotos(projectIndex, "after", e.target.files);
                        e.target.value = "";
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add project button */}
          <button
            type="button"
            onClick={addProject}
            className="
              w-full flex items-center justify-center gap-3 px-5 py-4
              border-2 border-dashed border-border rounded-xl
              text-text-muted hover:border-accent/50 hover:text-accent
              transition-all duration-200
              min-h-[48px] cursor-pointer
            "
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
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-lg font-medium">
              {gallery.projects.length > 0
                ? "Add Another Project"
                : "Add Project"}
            </span>
          </button>
        </div>
      )}

      {/* Gallery mode */}
      {mode === "gallery" && (
        <div className="space-y-4">
          {/* Upload zone */}
          {gallery.photos.length < MAX_GALLERY_PHOTOS && (
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleGalleryDrop}
              disabled={uploading === "gallery"}
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
                ${uploading === "gallery" ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {uploading === "gallery" ? (
                <Spinner size="lg" />
              ) : (
                <>
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="text-text-primary text-lg font-medium">
                    Drop photos here or click to browse
                  </p>
                  <p className="text-text-dim text-sm">
                    Up to {MAX_GALLERY_PHOTOS} photos ({gallery.photos.length}{" "}
                    uploaded)
                  </p>
                </>
              )}
            </button>
          )}

          <input
            ref={galleryInputRef}
            type="file"
            className="hidden"
            multiple
            accept={ACCEPTED_IMAGE_TYPES}
            onChange={(e) => {
              if (e.target.files) {
                handleGalleryFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />

          {/* Photo grid */}
          {gallery.photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {gallery.photos.map((url, index) => (
                <div
                  key={url}
                  className="relative aspect-square rounded-lg overflow-hidden bg-background border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryPhoto(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors cursor-pointer"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
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
        </div>
      )}

      {/* Continue button */}
      {hasContent && (
        <div className="pt-2 flex justify-end">
          <Button onClick={onNext} size="md">
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
