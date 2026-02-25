"use client";

import { useState } from "react";
import { X, FileText, MessageSquare } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import { Tooltip } from "@/components/ui";
import type { SitemapPageData, SitemapComment } from "@/lib/clients/sitemap-types";
import { PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";
import { SitemapSidebarDetails } from "./SitemapSidebarDetails";
import { SitemapNodeComments } from "./SitemapNodeComments";

interface SitemapSidebarTabsProps {
  nodeId: string;
  data: SitemapPageData;
  onUpdate: (nodeId: string, updates: Partial<SitemapPageData>) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
  onClose: () => void;
  comments: SitemapComment[];
  clientId: string;
  onCommentAdded: () => void;
  onResolveComment?: (commentId: string, resolved: boolean) => void;
}

export function SitemapSidebarTabs({
  nodeId,
  data,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddChild,
  onClose,
  comments,
  clientId,
  onCommentAdded,
  onResolveComment,
}: SitemapSidebarTabsProps) {
  const [tab, setTab] = useState("details");
  const typeConfig = PAGE_TYPE_CONFIG[data.pageType] ?? PAGE_TYPE_CONFIG.static;
  const nodeColor = data.color || typeConfig.color;

  const nodeCommentCount = comments.filter(
    (c) => c.node_id === nodeId && !c.parent_id
  ).length;

  return (
    <div className="w-80 border-l border-border bg-surface/50 backdrop-blur-sm flex flex-col" data-lenis-prevent>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: nodeColor }}
          />
          <span className="text-sm font-medium text-text-primary truncate">{data.label}</span>
        </div>
        <Tooltip content="Close" side="left">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-text-dim hover:text-text-primary hover:bg-background/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      {/* Tab triggers */}
      <Tabs.Root value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
        <Tabs.List className="flex border-b border-border px-5">
          <Tabs.Trigger
            value="details"
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors -mb-px ${
              tab === "details"
                ? "border-accent text-accent"
                : "border-transparent text-text-dim hover:text-text-muted"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Details
          </Tabs.Trigger>
          <Tabs.Trigger
            value="comments"
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors -mb-px ${
              tab === "comments"
                ? "border-accent text-accent"
                : "border-transparent text-text-dim hover:text-text-muted"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Comments
            {nodeCommentCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-accent/10 text-accent">
                {nodeCommentCount}
              </span>
            )}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="details" className="flex-1 overflow-y-auto" data-lenis-prevent>
          <SitemapSidebarDetails
            nodeId={nodeId}
            data={data}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onAddChild={onAddChild}
          />
        </Tabs.Content>

        <Tabs.Content value="comments" className="flex-1 flex flex-col min-h-0">
          <SitemapNodeComments
            nodeId={nodeId}
            comments={comments}
            clientId={clientId}
            onCommentAdded={onCommentAdded}
            onResolve={onResolveComment}
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
