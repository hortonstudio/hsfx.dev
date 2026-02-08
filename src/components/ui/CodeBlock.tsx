'use client';

import { type ReactNode } from 'react';

interface CodeBlockProps {
  code: string | ReactNode;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language, className = '' }: CodeBlockProps) {
  return (
    <div
      className={`relative bg-[#0D0D0D] border border-border rounded-lg overflow-hidden ${className}`}
    >
      {language && (
        <div className="absolute top-3 right-3 text-xs text-text-muted font-mono uppercase tracking-wide">
          {language}
        </div>
      )}
      <pre className="p-4 overflow-x-auto font-mono text-sm leading-relaxed text-text-primary">
        <code>{code}</code>
      </pre>

      <style jsx>{`
        :global(.syntax-keyword) {
          color: #c792ea;
        }
        :global(.syntax-string) {
          color: #c3e88d;
        }
        :global(.syntax-attr) {
          color: #ffcb6b;
        }
        :global(.syntax-value) {
          color: #82aaff;
        }
        :global(.syntax-comment) {
          color: #546e7a;
        }
        :global(.syntax-tag) {
          color: #f07178;
        }
      `}</style>
    </div>
  );
}
