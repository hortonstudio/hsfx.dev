"use client";

import { Button } from "@/components/ui";

interface SitemapToolbarProps {
  nodeCount: number;
  lastSaved: string | null;
  saving: boolean;
  onSave: () => void;
  onAutoLayout: () => void;
  onAddPage: () => void;
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onShare: () => void;
  onClose: () => void;
  title: string;
  status: string;
}

export function SitemapToolbar({
  nodeCount,
  lastSaved,
  saving,
  onSave,
  onAutoLayout,
  onAddPage,
  onFitView,
  onZoomIn,
  onZoomOut,
  onShare,
  onClose,
  title,
  status,
}: SitemapToolbarProps) {
  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const diff = Date.now() - new Date(lastSaved).getTime();
    if (diff < 5000) return "Just saved";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(lastSaved).toLocaleTimeString();
  };

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* Left: Title + actions */}
      <div className="flex items-center gap-2">
        <h2 className="font-serif text-sm font-medium text-text-primary">{title}</h2>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-text-dim uppercase tracking-wider">
          {status}
        </span>

        <div className="w-px h-4 bg-border mx-1" />

        <Button variant="ghost" size="sm" onClick={onSave} disabled={saving}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </Button>

        <Button variant="ghost" size="sm" onClick={onAutoLayout} title="Auto Layout">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </Button>

        <Button variant="ghost" size="sm" onClick={onAddPage} title="Add Page">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </Button>
      </div>

      {/* Center: Zoom */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onZoomOut} title="Zoom Out">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </Button>
        <Button variant="ghost" size="sm" onClick={onFitView} title="Fit View">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </Button>
        <Button variant="ghost" size="sm" onClick={onZoomIn} title="Zoom In">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </Button>
      </div>

      {/* Right: Status + Share + Close */}
      <div className="flex items-center gap-2">
        <div className="text-[11px] text-text-dim">
          {nodeCount} pages
          {lastSaved && (
            <>
              <span className="mx-1.5">·</span>
              {saving ? (
                <span className="text-yellow-500">Saving...</span>
              ) : (
                <span>Saved {formatLastSaved()}</span>
              )}
            </>
          )}
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        <Button variant="ghost" size="sm" onClick={onShare} title="Share">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </Button>

        <Button variant="ghost" size="sm" onClick={onClose} title="Close Editor">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
