"use client";

import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown, X } from "./Icons";

// Node types matching Webflow's navigator
export type NodeType = "element" | "component" | "slot";

export interface TreeNode {
  id: string;
  label: string;
  type: NodeType;
  children?: TreeNode[];
}

interface WebflowNavigatorProps {
  nodes: TreeNode[];
  selectedId?: string;
  onSelect?: (id: string, node: TreeNode) => void;
  title?: string;
  onClose?: () => void;
  onPin?: () => void;
  className?: string;
}

// Icons for different node types - clean, minimal design
function ElementIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
    >
      <rect
        x="1.5"
        y="1.5"
        width="9"
        height="9"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function ComponentIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
    >
      <path
        d="M6 1.5L10.5 4V8L6 10.5L1.5 8V4L6 1.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SlotIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
    >
      <rect
        x="1.5"
        y="1.5"
        width="9"
        height="9"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray="2 1.5"
      />
    </svg>
  );
}

function NodeIcon({ type, className = "" }: { type: NodeType; className?: string }) {
  switch (type) {
    case "component":
      return <ComponentIcon className={className} />;
    case "slot":
      return <SlotIcon className={className} />;
    default:
      return <ElementIcon className={className} />;
  }
}

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
  selectedId?: string;
  expandedIds: Set<string>;
  onSelect?: (id: string, node: TreeNode) => void;
  onToggle: (id: string) => void;
  isLastChild: boolean;
  parentLines: boolean[];
}

function TreeNodeItem({
  node,
  level,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  isLastChild,
  parentLines,
}: TreeNodeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isGreen = node.type === "component" || node.type === "slot";

  return (
    <div>
      {/* Node row */}
      <div
        className={`
          group flex items-center h-7 pr-2 cursor-pointer
          ${isSelected ? "bg-green-500/20" : "hover:bg-border/30"}
          transition-colors
        `}
        onClick={() => onSelect?.(node.id, node)}
      >
        {/* Tree lines and indentation */}
        <div className="flex items-center h-full" style={{ width: level * 16 + 8 }}>
          {/* Vertical lines from parents */}
          {parentLines.map((showLine, i) => (
            <div
              key={i}
              className="w-4 h-full flex justify-center"
            >
              {showLine && (
                <div className="w-px h-full bg-border-hover" />
              )}
            </div>
          ))}

          {/* Current level connector */}
          {level > 0 && (
            <div className="w-4 h-full flex items-center justify-center relative">
              {/* Vertical line */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-px bg-border-hover ${
                  isLastChild ? "h-1/2 top-0" : "h-full"
                }`}
              />
              {/* Horizontal line */}
              <div className="absolute left-1/2 w-2 h-px bg-border-hover" />
            </div>
          )}
        </div>

        {/* Expand/collapse toggle */}
        <div
          className="w-4 h-4 flex items-center justify-center flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
        >
          {hasChildren && (
            <span className="text-text-muted hover:text-text-secondary transition-colors">
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
          )}
        </div>

        {/* Icon */}
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mr-1.5">
          <NodeIcon
            type={node.type}
            className={isGreen ? "text-green-400" : "text-text-muted"}
          />
        </div>

        {/* Label */}
        <span
          className={`
            text-sm truncate
            ${isGreen ? "text-green-400" : "text-text-secondary"}
            ${isSelected ? "font-medium" : ""}
          `}
        >
          {node.label}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
              isLastChild={index === node.children!.length - 1}
              parentLines={[...parentLines, !isLastChild]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WebflowNavigator({
  nodes,
  selectedId: initialSelectedId,
  onSelect,
  title = "Navigator",
  onClose,
  onPin,
  className = "",
}: WebflowNavigatorProps) {
  // Track selected node internally
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSelectedId);

  // Track expanded nodes - start with all expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        if (node.children?.length) {
          ids.add(node.id);
          collectIds(node.children);
        }
      });
    };
    collectIds(nodes);
    return ids;
  });

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback((id: string, node: TreeNode) => {
    setSelectedId(id);
    onSelect?.(id, node);
  }, [onSelect]);

  return (
    <div
      className={`flex flex-col bg-surface border border-border rounded-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-medium text-text-primary">{title}</span>
        <div className="flex items-center gap-1">
          {onPin && (
            <button
              onClick={onPin}
              className="p-1 text-text-muted hover:text-text-primary hover:bg-border/50 rounded transition-colors"
              aria-label="Pin navigator"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7.5 1.5L10.5 4.5L6 9H3V6L7.5 1.5Z" />
                <path d="M1.5 10.5L3.5 8.5" />
              </svg>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-text-muted hover:text-text-primary hover:bg-border/50 rounded transition-colors"
              aria-label="Close navigator"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {nodes.map((node, index) => (
          <TreeNodeItem
            key={node.id}
            node={node}
            level={0}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onSelect={handleSelect}
            onToggle={handleToggle}
            isLastChild={index === nodes.length - 1}
            parentLines={[]}
          />
        ))}
      </div>
    </div>
  );
}
