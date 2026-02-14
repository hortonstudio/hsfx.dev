"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Link, Mail, ExternalLink, Info } from "./Icons";
import { Tooltip } from "./Tooltip";

// Property field types
export type PropertyType =
  | "text"
  | "color"
  | "link"
  | "select"
  | "toggle"
  | "segmented"
  | "slot"
  | "style";

export interface LinkValue {
  type: "url" | "page" | "section" | "email" | "phone" | "custom";
  url: string;
  openIn: "this" | "new";
  preload: "default" | "none" | "all";
}

export interface PropertyField {
  id: string;
  label: string;
  type: PropertyType;
  value: string | boolean | LinkValue | null;
  helpText?: string;
  options?: { label: string; value: string }[];
  suggestions?: string[];
}

export interface PropertySection {
  id: string;
  label: string;
  fields: PropertyField[];
  defaultExpanded?: boolean;
}

interface WebflowPropertiesProps {
  sections: PropertySection[];
  onChange?: (fieldId: string, value: PropertyField["value"]) => void;
  className?: string;
}

// Type indicator icon
function TypeIcon({ type }: { type: PropertyType }) {
  switch (type) {
    case "link":
      return <Link size={12} />;
    case "slot":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect
            x="1.5"
            y="1.5"
            width="9"
            height="9"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        </svg>
      );
    case "style":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1L10.5 4V8L6 11L1.5 8V4L6 1Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    default:
      return <span className="text-[10px] font-bold">T</span>;
  }
}

// Link type icons
function LinkTypeIcon({ type }: { type: LinkValue["type"] }) {
  switch (type) {
    case "url":
      return <Link size={14} />;
    case "page":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="10" height="10" rx="1" />
        </svg>
      );
    case "section":
      return <ExternalLink size={14} />;
    case "email":
      return <Mail size={14} />;
    case "phone":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 3C2 2.44772 2.44772 2 3 2H5L6.5 5L5 6.5C5 6.5 5.5 8.5 7.5 8.5L9 7L12 8.5V11C12 11.5523 11.5523 12 11 12C6 12 2 8 2 3Z" />
        </svg>
      );
    case "custom":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="7" r="5" />
          <path d="M7 4V7L9 9" />
        </svg>
      );
  }
}

// Text input field
function PropertyText({
  field,
  onChange,
}: {
  field: PropertyField;
  onChange?: (value: string) => void;
}) {
  return (
    <input
      type="text"
      value={(field.value as string) || ""}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full px-3 py-2 bg-background border border-border rounded-md
        text-sm text-text-primary placeholder:text-text-dim
        focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
        transition-colors"
      placeholder={field.label}
    />
  );
}

// Link configuration field
function PropertyLink({
  field,
  onChange,
}: {
  field: PropertyField;
  onChange?: (value: LinkValue) => void;
}) {
  const value = (field.value as LinkValue) || {
    type: "url",
    url: "#",
    openIn: "this",
    preload: "default",
  };

  const linkTypes: LinkValue["type"][] = ["url", "page", "section", "email", "phone", "custom"];

  return (
    <div className="space-y-3 p-3 bg-background border border-border rounded-md">
      {/* Link type selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted w-12">Type</span>
        <div className="flex gap-1">
          {linkTypes.map((type) => (
            <button
              key={type}
              onClick={() => onChange?.({ ...value, type })}
              className={`p-1.5 rounded transition-colors ${
                value.type === type
                  ? "bg-accent/20 text-accent"
                  : "text-text-muted hover:text-text-primary hover:bg-border/50"
              }`}
            >
              <LinkTypeIcon type={type} />
            </button>
          ))}
        </div>
      </div>

      {/* URL input */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted w-12">URL</span>
        <input
          type="text"
          value={value.url}
          onChange={(e) => onChange?.({ ...value, url: e.target.value })}
          className="flex-1 px-2 py-1.5 bg-surface border border-border rounded
            text-sm text-text-primary placeholder:text-text-dim
            focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Open in selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted w-12">Open in</span>
        <div className="flex gap-1 flex-1">
          {(["this", "new"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onChange?.({ ...value, openIn: opt })}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                value.openIn === opt
                  ? "bg-border text-text-primary"
                  : "text-text-muted hover:text-text-primary hover:bg-border/50"
              }`}
            >
              {opt === "this" ? "This tab" : "New tab"}
            </button>
          ))}
        </div>
      </div>

      {/* Preload selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted w-12">Preload</span>
        <select
          value={value.preload}
          onChange={(e) => onChange?.({ ...value, preload: e.target.value as LinkValue["preload"] })}
          className="flex-1 px-2 py-1.5 bg-surface border border-border rounded
            text-sm text-text-primary
            focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="default">Default</option>
          <option value="none">None</option>
          <option value="all">All</option>
        </select>
      </div>
    </div>
  );
}

// Select dropdown
function PropertySelect({
  field,
  onChange,
}: {
  field: PropertyField;
  onChange?: (value: string) => void;
}) {
  return (
    <select
      value={(field.value as string) || ""}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full px-3 py-2 bg-background border border-border rounded-md
        text-sm text-text-primary
        focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
        transition-colors"
    >
      {field.options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Boolean toggle with chip buttons
function PropertyToggle({
  field,
  onChange,
}: {
  field: PropertyField;
  onChange?: (value: boolean) => void;
}) {
  const value = field.value as boolean;

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value ? "true" : "false"}
        readOnly
        className="w-full px-3 py-2 bg-background border border-border rounded-md
          text-sm text-text-primary cursor-default"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onChange?.(true)}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            value
              ? "bg-border text-text-primary"
              : "text-text-muted hover:text-text-primary hover:bg-border/50"
          }`}
        >
          true
        </button>
        <button
          onClick={() => onChange?.(false)}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            !value
              ? "bg-border text-text-primary"
              : "text-text-muted hover:text-text-primary hover:bg-border/50"
          }`}
        >
          false
        </button>
      </div>
    </div>
  );
}

// Segmented control (Visible/Hidden style)
function PropertySegmented({
  field,
  onChange,
}: {
  field: PropertyField;
  onChange?: (value: string) => void;
}) {
  const value = field.value as string;
  const options = field.options || [
    { label: "Visible", value: "visible" },
    { label: "Hidden", value: "hidden" },
  ];

  return (
    <div className="flex rounded-md overflow-hidden border border-border">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange?.(opt.value)}
          className={`flex-1 px-3 py-2 text-sm transition-colors ${
            value === opt.value
              ? "bg-border text-text-primary"
              : "bg-background text-text-muted hover:text-text-primary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Slot reference (shows Empty or component name)
function PropertySlot({
  field,
}: {
  field: PropertyField;
}) {
  const value = field.value as string | null;

  return (
    <div
      className="w-full px-3 py-3 bg-background border border-border rounded-md
        text-sm text-center text-text-dim"
    >
      {value || "Empty"}
    </div>
  );
}

// Style selector
function PropertyStyle({
  field,
  onChange,
}: {
  field: PropertyField;
  onChange?: (value: string) => void;
}) {
  return (
    <select
      value={(field.value as string) || ""}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full px-3 py-2 bg-background border border-border rounded-md
        text-sm text-text-primary
        focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
    >
      {field.options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Single property field renderer
function PropertyFieldRenderer({
  field,
  onChange,
}: {
  field: PropertyField;
  onChange?: (fieldId: string, value: PropertyField["value"]) => void;
}) {
  const handleChange = (value: PropertyField["value"]) => {
    onChange?.(field.id, value);
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted">
          <TypeIcon type={field.type} />
        </span>
        <span className="text-sm text-text-secondary">{field.label}</span>
        {field.helpText && (
          <Tooltip content={field.helpText}>
            <button className="text-text-dim hover:text-text-muted transition-colors">
              <Info size={12} />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Field input */}
      {field.type === "text" && (
        <PropertyText field={field} onChange={handleChange as (v: string) => void} />
      )}
      {field.type === "link" && (
        <PropertyLink field={field} onChange={handleChange as (v: LinkValue) => void} />
      )}
      {field.type === "select" && (
        <PropertySelect field={field} onChange={handleChange as (v: string) => void} />
      )}
      {field.type === "toggle" && (
        <PropertyToggle field={field} onChange={handleChange as (v: boolean) => void} />
      )}
      {field.type === "segmented" && (
        <PropertySegmented field={field} onChange={handleChange as (v: string) => void} />
      )}
      {field.type === "slot" && <PropertySlot field={field} />}
      {field.type === "style" && (
        <PropertyStyle field={field} onChange={handleChange as (v: string) => void} />
      )}
    </div>
  );
}

// Collapsible section
function PropertySectionComponent({
  section,
  onChange,
}: {
  section: PropertySection;
  onChange?: (fieldId: string, value: PropertyField["value"]) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(section.defaultExpanded ?? true);

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Section header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-text-primary
          hover:bg-border/30 transition-colors"
      >
        <span className="text-text-muted">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        {section.label}
      </button>

      {/* Section content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {section.fields.map((field) => (
            <PropertyFieldRenderer
              key={field.id}
              field={field}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WebflowProperties({
  sections: initialSections,
  onChange,
  className = "",
}: WebflowPropertiesProps) {
  // Manage internal state for interactive updates
  const [sections, setSections] = useState<PropertySection[]>(initialSections);

  const handleChange = (fieldId: string, value: PropertyField["value"]) => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        fields: section.fields.map((field) =>
          field.id === fieldId ? { ...field, value } : field
        ),
      }))
    );
    onChange?.(fieldId, value);
  };

  return (
    <div
      className={`flex flex-col bg-surface border border-border rounded-lg overflow-hidden ${className}`}
    >
      {sections.map((section) => (
        <PropertySectionComponent
          key={section.id}
          section={section}
          onChange={handleChange}
        />
      ))}
    </div>
  );
}
