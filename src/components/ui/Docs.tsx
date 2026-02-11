"use client";

import { useState, type ReactNode } from "react";
import { Info, Warning, AlertCircle, CheckCircle, Zap, Copy, Check, Link, File } from "./Icons";

// Callout Component
type CalloutVariant = "info" | "warning" | "error" | "success" | "tip" | "note";

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Callout({
  variant = "info",
  title,
  children,
  className = "",
}: CalloutProps) {
  const config: Record<
    CalloutVariant,
    { icon: ReactNode; bg: string; border: string; text: string }
  > = {
    info: {
      icon: <Info size={20} />,
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-500",
    },
    warning: {
      icon: <Warning size={20} />,
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      text: "text-yellow-500",
    },
    error: {
      icon: <AlertCircle size={20} />,
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-500",
    },
    success: {
      icon: <CheckCircle size={20} />,
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      text: "text-green-500",
    },
    tip: {
      icon: <Zap size={20} />,
      bg: "bg-accent/10",
      border: "border-accent/30",
      text: "text-accent",
    },
    note: {
      icon: <File size={20} />,
      bg: "bg-gray-500/10",
      border: "border-gray-500/30",
      text: "text-gray-400",
    },
  };

  const { icon, bg, border, text } = config[variant];

  return (
    <div
      className={`flex gap-3 p-4 rounded-lg border ${bg} ${border} ${className}`}
      role="alert"
    >
      <div className={`flex-shrink-0 ${text}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`font-semibold mb-1 ${text}`}>{title}</h4>
        )}
        <div className="text-sm text-text-secondary [&>p]:mb-2 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  );
}

// Steps Component
interface StepProps {
  title: string;
  children: ReactNode;
}

interface StepsProps {
  children: ReactNode;
  className?: string;
}

export function Steps({ children, className = "" }: StepsProps) {
  return (
    <div className={`space-y-0 ${className}`}>
      {children}
    </div>
  );
}

export function Step({ title, children }: StepProps) {
  return (
    <div className="relative pl-10 pb-8 last:pb-0 group">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border group-last:hidden" />

      {/* Step number circle */}
      <div
        className="absolute left-0 top-0 w-8 h-8 rounded-full bg-accent/10 border-2 border-accent
          flex items-center justify-center text-sm font-semibold text-accent"
      >
        <span className="step-number" />
      </div>

      {/* Content */}
      <div>
        <h4 className="font-semibold text-text-primary mb-2">{title}</h4>
        <div className="text-sm text-text-secondary [&>p]:mb-2 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  );
}

// Auto-numbered Steps using CSS counters
export function NumberedSteps({ children, className = "" }: StepsProps) {
  return (
    <div className={`space-y-0 [counter-reset:step] ${className}`}>
      {children}
    </div>
  );
}

export function NumberedStep({ title, children }: StepProps) {
  return (
    <div className="relative pl-10 pb-8 last:pb-0 group [counter-increment:step]">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border group-last:hidden" />

      {/* Step number circle */}
      <div
        className="absolute left-0 top-0 w-8 h-8 rounded-full bg-accent/10 border-2 border-accent
          flex items-center justify-center text-sm font-semibold text-accent
          before:content-[counter(step)]"
      />

      {/* Content */}
      <div>
        <h4 className="font-semibold text-text-primary mb-2">{title}</h4>
        <div className="text-sm text-text-secondary [&>p]:mb-2 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  );
}

// Heading with anchor link
interface HeadingProps {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  id: string;
  children: ReactNode;
  className?: string;
}

export function Heading({
  as: Tag = "h2",
  id,
  children,
  className = "",
}: HeadingProps) {
  const sizes = {
    h1: "text-4xl font-bold",
    h2: "text-3xl font-bold",
    h3: "text-2xl font-semibold",
    h4: "text-xl font-semibold",
    h5: "text-lg font-medium",
    h6: "text-base font-medium",
  };

  return (
    <Tag
      id={id}
      className={`group flex items-center gap-2 text-text-primary scroll-mt-20 ${sizes[Tag]} ${className}`}
    >
      {children}
      <a
        href={`#${id}`}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-accent"
        aria-label={`Link to ${id}`}
      >
        <Link size={18} />
      </a>
    </Tag>
  );
}

// API Reference / Props Table
interface PropDefinition {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

interface APIReferenceProps {
  props: PropDefinition[];
  className?: string;
}

export function APIReference({ props, className = "" }: APIReferenceProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-semibold text-text-primary">Prop</th>
            <th className="text-left py-3 px-4 font-semibold text-text-primary">Type</th>
            <th className="text-left py-3 px-4 font-semibold text-text-primary">Default</th>
            <th className="text-left py-3 px-4 font-semibold text-text-primary">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-b border-border last:border-0">
              <td className="py-3 px-4">
                <code className="text-accent font-mono text-xs bg-accent/10 px-1.5 py-0.5 rounded">
                  {prop.name}
                  {prop.required && <span className="text-red-500 ml-0.5">*</span>}
                </code>
              </td>
              <td className="py-3 px-4">
                <code className="text-text-muted font-mono text-xs">{prop.type}</code>
              </td>
              <td className="py-3 px-4 text-text-muted">
                {prop.default ? (
                  <code className="font-mono text-xs">{prop.default}</code>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-3 px-4 text-text-secondary">{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Keyboard Shortcut
interface KeyboardShortcutProps {
  keys: string[];
  className?: string;
}

export function KeyboardShortcut({ keys, className = "" }: KeyboardShortcutProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {keys.map((key, index) => (
        <span key={index} className="inline-flex items-center">
          <kbd
            className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5
              text-xs font-mono font-medium text-text-secondary
              bg-surface border border-border rounded shadow-sm"
          >
            {key}
          </kbd>
          {index < keys.length - 1 && (
            <span className="mx-0.5 text-text-muted">+</span>
          )}
        </span>
      ))}
    </span>
  );
}

// Inline Code
interface InlineCodeProps {
  children: ReactNode;
  className?: string;
}

export function InlineCode({ children, className = "" }: InlineCodeProps) {
  return (
    <code
      className={`px-1.5 py-0.5 text-sm font-mono bg-accent/10 text-accent rounded ${className}`}
    >
      {children}
    </code>
  );
}

// Code Block with copy button (enhanced version)
interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlockWithCopy({
  code,
  language = "typescript",
  filename,
  showLineNumbers = false,
  className = "",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  return (
    <div className={`relative group rounded-lg overflow-hidden border border-border ${className}`}>
      {/* Header */}
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border">
          <span className="text-xs text-text-muted font-mono">{filename}</span>
          <span className="text-xs text-text-dim">{language}</span>
        </div>
      )}

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 text-text-muted hover:text-text-primary
          bg-surface/80 hover:bg-surface rounded-lg opacity-0 group-hover:opacity-100
          transition-all border border-border"
        aria-label="Copy code"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>

      {/* Code */}
      <pre className="overflow-x-auto p-4 bg-[#0d0d0d] text-sm">
        <code className="font-mono text-text-secondary">
          {showLineNumbers
            ? lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="select-none text-text-dim w-8 text-right pr-4">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </div>
              ))
            : code}
        </code>
      </pre>
    </div>
  );
}

// File Tree
interface FileTreeItem {
  name: string;
  type: "file" | "folder";
  children?: FileTreeItem[];
}

interface FileTreeProps {
  items: FileTreeItem[];
  className?: string;
}

export function FileTree({ items, className = "" }: FileTreeProps) {
  return (
    <div className={`font-mono text-sm ${className}`}>
      <FileTreeNode items={items} level={0} />
    </div>
  );
}

function FileTreeNode({ items, level }: { items: FileTreeItem[]; level: number }) {
  return (
    <ul className={level > 0 ? "ml-4" : ""}>
      {items.map((item, index) => (
        <li key={index} className="py-0.5">
          <div className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
            {item.type === "folder" ? (
              <span className="text-accent">📁</span>
            ) : (
              <span className="text-text-muted">📄</span>
            )}
            <span>{item.name}</span>
          </div>
          {item.children && <FileTreeNode items={item.children} level={level + 1} />}
        </li>
      ))}
    </ul>
  );
}
