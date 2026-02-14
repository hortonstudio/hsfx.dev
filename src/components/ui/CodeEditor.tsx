"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Copy, Check, Maximize, Minimize, Save } from "./Icons";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: "css" | "svg" | "xml" | "html" | "javascript" | "typescript" | "json";
  readOnly?: boolean;
  height?: string | number;
  minimap?: boolean;
  lineNumbers?: boolean;
  filename?: string;
  onSave?: (value: string) => void;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "css",
  readOnly = false,
  height = 300,
  minimap = false,
  lineNumbers = true,
  filename,
  onSave,
  className = "",
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDark = resolvedTheme === "dark";

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom dark theme matching site
    monaco.editor.defineTheme("hsfx-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "546e7a", fontStyle: "italic" },
        { token: "keyword", foreground: "c792ea" },
        { token: "string", foreground: "c3e88d" },
        { token: "number", foreground: "f78c6c" },
        { token: "tag", foreground: "f07178" },
        { token: "attribute.name", foreground: "ffcb6b" },
        { token: "attribute.value", foreground: "c3e88d" },
        { token: "delimiter", foreground: "89ddff" },
        { token: "type", foreground: "82aaff" },
      ],
      colors: {
        "editor.background": "#0d0d0d",
        "editor.foreground": "#e0e0e0",
        "editor.lineHighlightBackground": "#1a1a1a",
        "editor.selectionBackground": "#0ea5e940",
        "editorCursor.foreground": "#0ea5e9",
        "editorLineNumber.foreground": "#555555",
        "editorLineNumber.activeForeground": "#888888",
        "editor.inactiveSelectionBackground": "#0ea5e920",
      },
    });

    // Define custom light theme
    monaco.editor.defineTheme("hsfx-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6a737d", fontStyle: "italic" },
        { token: "keyword", foreground: "d73a49" },
        { token: "string", foreground: "22863a" },
        { token: "number", foreground: "005cc5" },
        { token: "tag", foreground: "22863a" },
        { token: "attribute.name", foreground: "6f42c1" },
        { token: "attribute.value", foreground: "032f62" },
        { token: "delimiter", foreground: "24292e" },
        { token: "type", foreground: "005cc5" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#24292e",
        "editor.lineHighlightBackground": "#f6f8fa",
        "editor.selectionBackground": "#0ea5e930",
        "editorCursor.foreground": "#0ea5e9",
        "editorLineNumber.foreground": "#a3a3a3",
        "editorLineNumber.activeForeground": "#525252",
        "editor.inactiveSelectionBackground": "#0ea5e915",
      },
    });

    // Set the theme
    monaco.editor.setTheme(isDark ? "hsfx-dark" : "hsfx-light");

    // Add Ctrl+S save shortcut (uses ref to avoid stale closure)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSaveRef.current();
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = useCallback(() => {
    if (onSave && !readOnly) {
      setIsSaving(true);
      onSave(value);
      setTimeout(() => setIsSaving(false), 1000);
    }
  }, [onSave, value, readOnly]);

  // Keep a ref so the Monaco keybinding always calls the latest save
  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Sync fullscreen state with browser's fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Map svg to xml for Monaco
  const monacoLanguage = language === "svg" ? "xml" : language;
  const isFullHeight = height === "100%";

  return (
    <div
      ref={containerRef}
      className={`relative rounded-lg overflow-hidden border border-border bg-surface ${isFullHeight ? "h-full flex flex-col" : ""} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="text-sm font-mono text-text-secondary">{filename}</span>
          )}
          {!filename && (
            <span className="text-xs text-text-muted uppercase">{language}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-border/50 rounded transition-colors"
            aria-label="Copy code"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-border/50 rounded transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          {/* Save button */}
          {onSave && !readOnly && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-2 py-1 text-sm text-text-secondary hover:text-accent
                hover:bg-accent/10 rounded transition-colors disabled:opacity-50"
              aria-label="Save (Ctrl+S)"
            >
              <Save size={14} />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className={isFullHeight ? "flex-1 min-h-0" : undefined}>
        <Editor
          height={isFullscreen ? "calc(100vh - 48px)" : isFullHeight ? "100%" : height}
          language={monacoLanguage}
          value={value}
          onChange={(val) => onChange?.(val || "")}
          onMount={handleEditorMount}
          theme={isDark ? "hsfx-dark" : "hsfx-light"}
          options={{
            readOnly,
            minimap: { enabled: minimap },
            lineNumbers: lineNumbers ? "on" : "off",
            fontSize: 13,
            fontFamily: "var(--font-geist-mono), monospace",
            tabSize: 2,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            wordWrap: "on",
            folding: true,
            glyphMargin: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-surface">
              <div className="text-text-muted text-sm">Loading editor...</div>
            </div>
          }
        />
      </div>
    </div>
  );
}
