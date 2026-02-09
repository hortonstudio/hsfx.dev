"use client";

import { useState } from "react";

interface ComponentShowcaseProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  code?: string;
}

export function ComponentShowcase({
  title,
  description,
  children,
  code,
}: ComponentShowcaseProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border bg-surface/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-text-primary">{title}</h3>
            {description && (
              <p className="text-sm text-text-muted mt-0.5">{description}</p>
            )}
          </div>
          {code && (
            <button
              onClick={() => setShowCode(!showCode)}
              className="text-sm text-text-muted hover:text-text-primary transition-colors px-3 py-1 rounded-md hover:bg-surface"
            >
              {showCode ? "Hide code" : "Show code"}
            </button>
          )}
        </div>
      </div>
      <div className="p-6 bg-background">{children}</div>
      {code && showCode && (
        <div className="border-t border-border">
          <pre className="p-4 overflow-x-auto text-sm font-mono text-text-secondary bg-surface">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
