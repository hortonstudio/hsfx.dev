"use client";

import { useState } from "react";
import { Button, Badge, Input, Spinner } from "@/components/ui";
import type { Client } from "@/lib/clients/types";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

interface ClientOverviewProps {
  client: Client;
  knowledgeEntryCount: number;
  onboardConfigCount: number;
  submissionCount: number;
  onClientUpdated: () => void;
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

const STATUS_VARIANTS: Record<string, "success" | "warning" | "default"> = {
  active: "success",
  inactive: "warning",
  archived: "default",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════

export function ClientOverview({
  client,
  knowledgeEntryCount,
  onboardConfigCount,
  submissionCount,
  onClientUpdated,
}: ClientOverviewProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: client.first_name,
    last_name: client.last_name,
    business_name: client.business_name,
    phone: client.phone,
  });

  function startEditing() {
    setEditForm({
      first_name: client.first_name,
      last_name: client.last_name,
      business_name: client.business_name,
      phone: client.phone,
    });
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function saveChanges() {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setEditing(false);
        onClientUpdated();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Client info card */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xs font-medium text-text-dim uppercase tracking-widest">
            Client Information
          </h2>
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={startEditing}>
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={saveChanges} disabled={saving}>
                {saving ? <Spinner size="sm" /> : "Save"}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {/* Name */}
          <div>
            <p className="text-text-dim text-xs mb-1">Full Name</p>
            {editing ? (
              <div className="flex gap-2">
                <Input
                  value={editForm.first_name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, first_name: e.target.value }))
                  }
                  placeholder="First name"
                />
                <Input
                  value={editForm.last_name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, last_name: e.target.value }))
                  }
                  placeholder="Last name"
                />
              </div>
            ) : (
              <p className="text-text-primary font-medium">
                {client.first_name} {client.last_name}
              </p>
            )}
          </div>

          {/* Business name */}
          <div>
            <p className="text-text-dim text-xs mb-1">Business Name</p>
            {editing ? (
              <Input
                value={editForm.business_name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, business_name: e.target.value }))
                }
                placeholder="Business name"
              />
            ) : (
              <p className="text-text-primary font-medium">
                {client.business_name}
              </p>
            )}
          </div>

          {/* Email (not editable) */}
          <div>
            <p className="text-text-dim text-xs mb-1">Email</p>
            <a
              href={`mailto:${client.email}`}
              className="text-accent hover:text-accent-hover transition-colors font-medium"
            >
              {client.email}
            </a>
          </div>

          {/* Phone */}
          <div>
            <p className="text-text-dim text-xs mb-1">Phone</p>
            {editing ? (
              <Input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="Phone number"
              />
            ) : (
              <p className="text-text-primary font-medium">
                {client.phone || (
                  <span className="text-text-dim italic font-normal">
                    Not set
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <p className="text-text-dim text-xs mb-1">Status</p>
            <Badge
              variant={STATUS_VARIANTS[client.status] ?? "default"}
              dot
              size="sm"
            >
              {client.status}
            </Badge>
          </div>

          {/* Member since */}
          <div>
            <p className="text-text-dim text-xs mb-1">Member Since</p>
            <p className="text-text-primary font-medium">
              {formatDate(client.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-2xl font-semibold text-text-primary">
            {knowledgeEntryCount}
          </p>
          <p className="text-sm text-text-muted mt-1">
            Knowledge {knowledgeEntryCount === 1 ? "Entry" : "Entries"}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-2xl font-semibold text-text-primary">
            {onboardConfigCount}
          </p>
          <p className="text-sm text-text-muted mt-1">
            Onboarding {onboardConfigCount === 1 ? "Form" : "Forms"}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-2xl font-semibold text-text-primary">
            {submissionCount}
          </p>
          <p className="text-sm text-text-muted mt-1">
            {submissionCount === 1 ? "Submission" : "Submissions"}
          </p>
        </div>
      </div>
    </div>
  );
}
