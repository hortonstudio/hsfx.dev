"use client";

import { useState } from "react";
import { Button, Modal, Input, Textarea, Spinner } from "@/components/ui";

interface AddNotesModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onSaved: () => void;
}

export function AddNotesModal({ open, onClose, clientId, onSaved }: AddNotesModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setContent("");
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim()) {
      setError("Notes content is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${clientId}/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "meeting_notes",
          title: title.trim() || null,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save notes");
      }

      resetForm();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Notes" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting title or topic"
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Notes
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or type meeting notes, observations, client feedback..."
            disabled={submitting}
            className="min-h-[200px]"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : "Save Notes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
