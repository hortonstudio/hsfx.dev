"use client";

import { useState } from "react";
import { Button, Modal, Input, Spinner } from "@/components/ui";

interface CreateClientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateClientModal({ open, onClose, onCreated }: CreateClientModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setBusinessName("");
    setEmail("");
    setPhone("");
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          business_name: businessName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create client");
      }

      resetForm();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Client" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">
              First Name
            </label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">
              Last Name
            </label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              required
              disabled={submitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Business Name
          </label>
          <Input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Business name"
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@example.com"
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Phone
          </label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(optional)"
            disabled={submitting}
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
            {submitting ? <Spinner size="sm" /> : "Create Client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
