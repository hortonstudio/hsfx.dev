"use client";

import { useState } from "react";

export interface TableOfContentsItem {
  id: string;
  label: string;
  level?: 1 | 2 | 3;
}

export interface DocRightSidebarProps {
  tableOfContents?: TableOfContentsItem[];
  currentSection?: string;
  onDownloadMd?: () => void;
  onCopyLink?: () => void;
  prevPage?: { label: string; href: string };
  nextPage?: { label: string; href: string };
  className?: string;
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}


export function DocRightSidebar({
  tableOfContents,
  currentSection,
  onDownloadMd,
  onCopyLink,
  prevPage,
  nextPage,
  className = "",
}: DocRightSidebarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (onCopyLink) {
      onCopyLink();
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (onDownloadMd) {
      onDownloadMd();
    }
  };

  return (
    <aside className={`hidden xl:block w-56 flex-shrink-0 ${className}`}>
      <div className="sticky top-20 space-y-6">
        {/* Table of Contents */}
        {tableOfContents && tableOfContents.length > 0 && (
          <nav>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              On this page
            </h4>
            <ul className="space-y-1">
              {tableOfContents.map((item) => {
                const isActive = currentSection === item.id;
                const indent = item.level === 2 ? "pl-3" : item.level === 3 ? "pl-6" : "";

                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={`
                        block py-1 text-sm transition-colors ${indent}
                        ${isActive
                          ? "text-accent font-medium"
                          : "text-text-muted hover:text-text-primary"
                        }
                      `}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Utilities */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Actions
          </h4>

          {onDownloadMd && (
            <button
              onClick={handleDownload}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary
                hover:text-text-primary hover:bg-surface rounded-lg transition-colors"
            >
              <DownloadIcon />
              <span>Download MD</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary
              hover:text-text-primary hover:bg-surface rounded-lg transition-colors"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span>{copied ? "Copied!" : "Copy link"}</span>
          </button>
        </div>

        {/* Prev/Next Navigation */}
        {(prevPage || nextPage) && (
          <div className="space-y-2 pt-4 border-t border-border">
            {prevPage && (
              <a
                href={prevPage.href}
                className="group flex items-center gap-2 py-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                <ChevronLeftIcon />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-dim">Previous</div>
                  <div className="truncate">{prevPage.label}</div>
                </div>
              </a>
            )}
            {nextPage && (
              <a
                href={nextPage.href}
                className="group flex items-center gap-2 py-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-xs text-text-dim">Next</div>
                  <div className="truncate">{nextPage.label}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
