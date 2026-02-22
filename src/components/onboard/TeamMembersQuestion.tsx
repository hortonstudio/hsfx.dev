"use client";

import { useState, useRef, useCallback } from "react";
import { Input, Textarea, Button, Spinner } from "@/components/ui";
import type { QuestionProps, TeamMember } from "@/lib/onboard/types";

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/avif";
const BIO_MAX_LENGTH = 150;

export function TeamMembersQuestion({
  question,
  value,
  onChange,
  onNext,
  onFileUpload,
  slug,
}: QuestionProps) {
  const members: TeamMember[] = Array.isArray(value)
    ? (value as TeamMember[])
    : [];

  const [isAdding, setIsAdding] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhoto, setEditPhoto] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setEditName("");
    setEditBio("");
    setEditPhoto(undefined);
    setIsAdding(false);
  };

  const handleAddMember = () => {
    if (!editName.trim()) return;

    const newMember: TeamMember = {
      name: editName.trim(),
      bio: editBio.trim(),
      photoUrl: editPhoto,
    };
    const updated = [...members, newMember];
    onChange(updated);
    resetForm();
  };

  const handleRemoveMember = (index: number) => {
    const updated = members.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handlePhotoUpload = useCallback(
    async (file: File) => {
      if (!onFileUpload || !slug) return;
      setUploading(true);
      try {
        const url = await onFileUpload(slug, question.id, file);
        setEditPhoto(url);
      } catch {
        // Upload failed silently
      }
      setUploading(false);
    },
    [onFileUpload, slug, question.id]
  );

  const startAdding = () => {
    setIsAdding(true);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="space-y-4">
      {/* Existing member cards */}
      {members.length > 0 && (
        <div className="space-y-3">
          {members.map((member, index) => (
            <div
              key={`${member.name}-${index}`}
              className="flex items-center gap-4 px-4 py-3 bg-surface border border-border rounded-xl"
            >
              {/* Photo thumbnail or placeholder */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-background border border-border flex items-center justify-center">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>

              {/* Name and bio */}
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium text-lg truncate">
                  {member.name}
                </p>
                {member.bio && (
                  <p className="text-text-muted text-sm truncate">
                    {member.bio}
                  </p>
                )}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveMember(index)}
                className="flex-shrink-0 p-2 text-text-dim hover:text-red-500 transition-colors cursor-pointer"
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

      {/* Add member form (inline) */}
      {isAdding ? (
        <div className="border-2 border-border rounded-xl p-5 space-y-4 bg-surface">
          <div className="flex items-start gap-4">
            {/* Photo upload */}
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading}
                className="w-16 h-16 rounded-full overflow-hidden bg-background border-2 border-dashed border-border hover:border-accent/50 flex items-center justify-center transition-colors cursor-pointer"
              >
                {uploading ? (
                  <Spinner size="sm" />
                ) : editPhoto ? (
                  <img
                    src={editPhoto}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePhotoUpload(file);
                    e.target.value = "";
                  }
                }}
              />
              <p className="text-text-dim text-xs text-center mt-1">Photo</p>
            </div>

            {/* Name and Bio fields */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  Name
                </label>
                <Input
                  ref={nameInputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Team member name"
                  className="!text-lg !py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  Short Bio
                </label>
                <Textarea
                  value={editBio}
                  onChange={(e) => {
                    if (e.target.value.length <= BIO_MAX_LENGTH) {
                      setEditBio(e.target.value);
                    }
                  }}
                  placeholder="A brief description of their role..."
                  className="!text-base !py-3 min-h-[80px]"
                  maxLength={BIO_MAX_LENGTH}
                />
                <p className="text-text-dim text-xs mt-1 text-right">
                  {editBio.length} / {BIO_MAX_LENGTH}
                </p>
              </div>
            </div>
          </div>

          {/* Form actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-text-muted hover:text-text-primary transition-colors cursor-pointer text-sm font-medium"
            >
              Cancel
            </button>
            <Button
              onClick={handleAddMember}
              size="md"
              disabled={!editName.trim()}
            >
              Add Member
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={startAdding}
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
          <span className="text-lg font-medium">Add Team Member</span>
        </button>
      )}

      {/* Continue button */}
      {members.length > 0 && !isAdding && (
        <div className="pt-2 flex justify-end">
          <Button onClick={onNext} size="md">
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
