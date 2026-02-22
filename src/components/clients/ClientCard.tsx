"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";
import type { Client } from "@/lib/clients/types";

const STATUS_VARIANTS: Record<string, "success" | "default"> = {
  active: "success",
  inactive: "default",
  archived: "default",
};

export function ClientCard({ client }: { client: Client }) {
  const createdDate = new Date(client.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/clients/${client.id}`}
      className="group block p-5 bg-surface border border-border rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base font-medium text-text-primary group-hover:text-accent transition-colors">
            {client.business_name}
          </h3>
          <p className="text-sm text-text-muted">
            {client.first_name} {client.last_name}
          </p>
        </div>
        <Badge variant={STATUS_VARIANTS[client.status] ?? "default"} dot size="sm">
          {client.status}
        </Badge>
      </div>

      <p className="text-xs text-text-dim font-mono mb-3">{client.email}</p>

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-text-dim">Created {createdDate}</span>
      </div>
    </Link>
  );
}
