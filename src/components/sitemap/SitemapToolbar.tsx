"use client";

import {
  ArrowLeft,
  Plus,
  Save,
  Share2,
  Download,
  Eye,
  Upload,
} from "lucide-react";
import { Button, Badge, Tooltip } from "@/components/ui";

interface SitemapToolbarProps {
  nodeCount: number;
  lastSaved: string | null;
  saving: boolean;
  onSave: () => void;
  onAddPage: () => void;
  onShare: () => void;
  onExport?: () => void;
  onClose: () => void;
  title: string;
  status: string;
  shareSlug?: string | null;
  onPublish?: () => void;
  publishing?: boolean;
  publishedAt?: string | null;
  hasUnpublishedChanges?: boolean;
}

export function SitemapToolbar({
  nodeCount,
  lastSaved,
  saving,
  onSave,
  onAddPage,
  onShare,
  onExport,
  onClose,
  title,
  status,
  shareSlug,
  onPublish,
  publishing,
  publishedAt,
  hasUnpublishedChanges,
}: SitemapToolbarProps) {
  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const diff = Date.now() - new Date(lastSaved).getTime();
    if (diff < 5000) return "Just saved";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(lastSaved).toLocaleTimeString();
  };

  const formatPublishedAt = () => {
    if (!publishedAt) return null;
    const diff = Date.now() - new Date(publishedAt).getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(publishedAt).toLocaleDateString();
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface/90 backdrop-blur-md">
      {/* Left: Back + Title + Status */}
      <div className="flex items-center gap-3">
        <Tooltip content="Back" side="bottom">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Tooltip>
        <div className="w-px h-5 bg-border" />
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

      {/* Center: Actions */}
      <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-background/50">
        <Tooltip content="Add Page" side="bottom">
          <Button variant="ghost" size="sm" onClick={onAddPage}>
            <Plus className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>

      {/* Right: Save status + Publish + Share + Close */}
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
          {publishedAt && (
            <>
              <span className="text-border">|</span>
              {hasUnpublishedChanges ? (
                <span className="text-yellow-500">Unpublished changes</span>
              ) : (
                <span className="text-emerald-500">Published {formatPublishedAt()}</span>
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

        {onPublish && (
          <Tooltip content="Publish to live" side="bottom">
            <Button
              variant={hasUnpublishedChanges ? "primary" : "ghost"}
              size="sm"
              onClick={onPublish}
              disabled={publishing || saving}
              className={hasUnpublishedChanges ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
            >
              {publishing ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </Button>
          </Tooltip>
        )}

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

        {shareSlug && (
          <Tooltip content="View Live" side="bottom">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/sitemap/${shareSlug}`, "_blank")}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
