"use client";

import {
  Plus,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Maximize,
  Save,
  Share2,
  Download,
  X,
  Network,
  List,
} from "lucide-react";
import { Button, Badge, Tooltip } from "@/components/ui";

export type SitemapView = "canvas" | "structure";

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
  onExport?: () => void;
  onClose: () => void;
  title: string;
  status: string;
  view: SitemapView;
  onViewChange: (view: SitemapView) => void;
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
  onExport,
  onClose,
  title,
  status,
  view,
  onViewChange,
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
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface/90 backdrop-blur-md">
      {/* Left: Title + Status */}
      <div className="flex items-center gap-3">
        <h2 className="font-serif text-base font-medium text-text-primary tracking-tight">
          {title}
        </h2>
        <Badge
          variant={status === "active" ? "success" : "default"}
          size="sm"
          dot
        >
          {status}
        </Badge>
      </div>

      {/* Center: View Toggle + Action Groups */}
      <div className="flex items-center gap-1">
        {/* View toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-background/50">
          <button
            type="button"
            onClick={() => onViewChange("canvas")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md transition-colors ${
              view === "canvas"
                ? "bg-surface text-text-primary font-medium shadow-sm"
                : "text-text-dim hover:text-text-muted"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Canvas
          </button>
          <button
            type="button"
            onClick={() => onViewChange("structure")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md transition-colors ${
              view === "structure"
                ? "bg-surface text-text-primary font-medium shadow-sm"
                : "text-text-dim hover:text-text-muted"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Structure
          </button>
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Edit group */}
        <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-background/50">
          <Tooltip content="Add Page" side="bottom">
            <Button variant="ghost" size="sm" onClick={onAddPage}>
              <Plus className="w-4 h-4" />
            </Button>
          </Tooltip>
          {view === "canvas" && (
            <Tooltip content="Auto Layout" side="bottom">
              <Button variant="ghost" size="sm" onClick={onAutoLayout}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </Tooltip>
          )}
        </div>

        {view === "canvas" && (
          <>
            <div className="w-px h-5 bg-border mx-1" />

            {/* Zoom group - only for canvas */}
            <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-background/50">
              <Tooltip content="Zoom Out" side="bottom">
                <Button variant="ghost" size="sm" onClick={onZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Fit View" side="bottom">
                <Button variant="ghost" size="sm" onClick={onFitView}>
                  <Maximize className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Zoom In" side="bottom">
                <Button variant="ghost" size="sm" onClick={onZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </>
        )}
      </div>

      {/* Right: Save status + Share + Close */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-text-dim">
          <span>{nodeCount} pages</span>
          {lastSaved && (
            <>
              <span className="text-border">|</span>
              {saving ? (
                <span className="flex items-center gap-1.5 text-yellow-500">
                  <span className="w-3 h-3 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                  Saving
                </span>
              ) : (
                <span className="text-text-muted">{formatLastSaved()}</span>
              )}
            </>
          )}
        </div>

        <div className="w-px h-5 bg-border" />

        <Tooltip content="Save (Cmd+S)" side="bottom">
          <Button variant="ghost" size="sm" onClick={onSave} disabled={saving}>
            <Save className="w-4 h-4" />
          </Button>
        </Tooltip>

        {onExport && (
          <Tooltip content="Export JSON" side="bottom">
            <Button variant="ghost" size="sm" onClick={onExport}>
              <Download className="w-4 h-4" />
            </Button>
          </Tooltip>
        )}

        <Tooltip content="Share" side="bottom">
          <Button variant="ghost" size="sm" onClick={onShare}>
            <Share2 className="w-4 h-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Close" side="bottom">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
