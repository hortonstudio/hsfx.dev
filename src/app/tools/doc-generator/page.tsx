"use client";

import { useState, useCallback } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/client";
import {
  GridBackground,
  PageTransition,
  CursorGlow,
  Button,
  CodeEditor,
  WebflowNavigator,
  WebflowProperties,
  DesignTokensTable,
} from "@/components/ui";
import { ChevronDown, ChevronRight } from "@/components/ui/Icons";

import { generateDocs, validateExtractorOutput, type GenerationError } from "@/lib/doc-generator/generator";
import { generateMarkdown, generateIndexMarkdown } from "@/lib/doc-generator/markdown";
import { EXTRACTOR_SCRIPT } from "@/lib/doc-generator/extractor-script";
import type { ComponentDoc, ExtractorOutput } from "@/lib/doc-generator/types";

// ════════════════════════════════════════════════════════════
// STEP INDICATOR
// ════════════════════════════════════════════════════════════

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: "Copy Script" },
    { num: 2, label: "Paste Output" },
    { num: 3, label: "Results" },
  ];

  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center">
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              transition-colors
              ${
                currentStep === step.num
                  ? "bg-accent text-white"
                  : currentStep > step.num
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-surface border border-border text-text-muted"
              }
            `}
          >
            {currentStep > step.num ? "✓" : step.num}
          </div>
          <span
            className={`ml-2 text-sm ${
              currentStep === step.num ? "text-text-primary" : "text-text-muted"
            }`}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div className="w-12 h-px bg-border mx-4" />
          )}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 1: COPY SCRIPT
// ════════════════════════════════════════════════════════════

function Step1CopyScript({ onNext }: { onNext: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showScript, setShowScript] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(EXTRACTOR_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl text-text-primary mb-2">
          Extract Component Data
        </h2>
        <p className="text-text-muted">
          Run this script in the Webflow Designer console to extract all component data
        </p>
      </div>

      {/* Copy Button - Primary Action */}
      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          onClick={handleCopy}
          className="px-8"
        >
          {copied ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Script Copied!
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Extractor Script
            </>
          )}
        </Button>
        <button
          onClick={() => setShowScript(!showScript)}
          className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
        >
          {showScript ? "Hide" : "Show"} script preview
          <svg
            className={`w-4 h-4 transition-transform ${showScript ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Script Preview - Collapsible */}
      {showScript && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="border-b border-border px-4 py-2 flex items-center justify-between">
            <span className="text-sm text-text-muted">component-extractor.js</span>
            <span className="text-xs text-text-dim">
              {EXTRACTOR_SCRIPT.length.toLocaleString()} chars
            </span>
          </div>
          <CodeEditor
            value={EXTRACTOR_SCRIPT}
            language="javascript"
            readOnly
            height="300px"
            lineNumbers
          />
        </div>
      )}

      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-accent mb-2">Instructions</h4>
        <ol className="text-sm text-text-muted space-y-1 list-decimal list-inside">
          <li>Open your Webflow project in the Designer</li>
          <li>Open the browser console (F12 → Console tab)</li>
          <li>Paste the script and press Enter</li>
          <li>Wait for extraction to complete (may take a few seconds)</li>
          <li>The JSON will be copied to your clipboard automatically</li>
        </ol>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>
          Next: Paste Output
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 2: PASTE OUTPUT
// ════════════════════════════════════════════════════════════

function Step2PasteOutput({
  onBack,
  onProcess,
}: {
  onBack: () => void;
  onProcess: (docs: ComponentDoc[], errors: GenerationError[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dataSize, setDataSize] = useState<number | null>(null);

  const processJson = useCallback(async (jsonInput: string) => {
    setError(null);
    setIsProcessing(true);
    setProgress(0);
    setDataSize(jsonInput.length);

    try {
      // Parse JSON
      setProgress(10);
      let data: unknown;
      try {
        data = JSON.parse(jsonInput);
      } catch {
        throw new Error("Invalid JSON: Could not parse the input");
      }

      // Validate structure
      setProgress(20);
      const validation = validateExtractorOutput(data);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Process in chunks to avoid blocking UI
      setProgress(30);
      await new Promise((r) => requestAnimationFrame(r));

      // Generate docs
      setProgress(50);
      const result = generateDocs(data as ExtractorOutput);

      setProgress(100);
      await new Promise((r) => setTimeout(r, 200));

      onProcess(result.docs, result.errors);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred");
      setIsProcessing(false);
      setDataSize(null);
    }
  }, [onProcess]);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setError("Clipboard is empty");
        return;
      }
      await processJson(text);
    } catch {
      // Clipboard permission denied or other error
      setError("Could not read from clipboard. Please grant clipboard permission or use the manual paste option.");
    }
  }, [processJson]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl text-text-primary mb-2">
          Import Extractor Output
        </h2>
        <p className="text-text-muted">
          Paste the JSON output from the extractor script
        </p>
      </div>

      {/* Main Paste Button */}
      {!isProcessing && (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <Button
            size="lg"
            onClick={handlePasteFromClipboard}
            className="px-8"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Paste from Clipboard
          </Button>
          <p className="text-sm text-text-dim">
            Make sure you have the extractor JSON in your clipboard
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-400 mb-1">Error</h4>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {isProcessing && (
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-full bg-border rounded-full h-2 overflow-hidden">
              <div
                className="bg-accent h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-text-muted whitespace-nowrap">
              {progress}%
            </span>
          </div>
          <p className="text-sm text-text-muted">
            Processing components...
            {dataSize && (
              <span className="text-text-dim ml-2">
                ({(dataSize / 1024 / 1024).toFixed(1)} MB)
              </span>
            )}
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isProcessing}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 3: RESULTS
// ════════════════════════════════════════════════════════════

function ComponentPreview({ doc }: { doc: ComponentDoc }) {
  const [activeTab, setActiveTab] = useState<"tree" | "properties" | "css" | "tokens">("tree");

  return (
    <div className="border-t border-border mt-4 pt-4">
      <div className="flex gap-2 mb-4">
        {(["tree", "properties", "css", "tokens"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === tab
                ? "bg-accent/20 text-accent"
                : "text-text-muted hover:text-text-primary hover:bg-border/50"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="max-h-96 overflow-auto">
        {activeTab === "tree" && (
          <WebflowNavigator nodes={doc.tree} title="Render Tree" />
        )}
        {activeTab === "properties" && (
          <WebflowProperties sections={doc.properties} />
        )}
        {activeTab === "css" && (
          <CodeEditor
            value={doc.css || "/* No CSS */"}
            language="css"
            readOnly
            height="300px"
          />
        )}
        {activeTab === "tokens" && (
          <DesignTokensTable tokens={doc.tokens} />
        )}
      </div>
    </div>
  );
}

function ComponentRow({ doc }: { doc: ComponentDoc }) {
  const [expanded, setExpanded] = useState(false);

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, `${doc.slug}.json`);
  };

  const handleDownloadMd = () => {
    const md = generateMarkdown(doc);
    const blob = new Blob([md], { type: "text/markdown" });
    saveAs(blob, `${doc.slug}.md`);
  };

  return (
    <div className="border-b border-border last:border-b-0">
      <div
        className="flex items-center justify-between py-3 px-4 hover:bg-border/20 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-text-muted">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          <span className="text-text-primary font-medium">{doc.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-xs text-text-muted">
            <span>{doc.stats.propertyCount} props</span>
            <span>{doc.stats.variantCount} variants</span>
            <span>{doc.stats.styleCount} styles</span>
            <span>{doc.stats.tokenCount} tokens</span>
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={handleDownloadJson}>
              JSON
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownloadMd}>
              MD
            </Button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4">
          <ComponentPreview doc={doc} />
        </div>
      )}
    </div>
  );
}

function Step3Results({
  docs,
  errors,
  onStartOver,
}: {
  docs: ComponentDoc[];
  errors: GenerationError[];
  onStartOver: () => void;
}) {
  // Group by group name
  const groups = new Map<string, ComponentDoc[]>();
  for (const doc of docs) {
    const group = doc.group || "Ungrouped";
    const existing = groups.get(group) || [];
    existing.push(doc);
    groups.set(group, existing);
  }
  const sortedGroups = Array.from(groups.keys()).sort();

  // Calculate stats
  const totalProps = docs.reduce((sum, d) => sum + d.stats.propertyCount, 0);
  const totalTokens = docs.reduce((sum, d) => sum + d.stats.tokenCount, 0);
  const totalStyles = docs.reduce((sum, d) => sum + d.stats.styleCount, 0);

  const handleDownloadAllJson = async () => {
    const zip = new JSZip();
    const folder = zip.folder("json")!;

    folder.file("_all.json", JSON.stringify(docs, null, 2));
    for (const doc of docs) {
      folder.file(`${doc.slug}.json`, JSON.stringify(doc, null, 2));
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "component-docs-json.zip");
  };

  const handleDownloadAllMd = async () => {
    const zip = new JSZip();
    const folder = zip.folder("md")!;

    folder.file("_index.md", generateIndexMarkdown(docs));
    for (const doc of docs) {
      folder.file(`${doc.slug}.md`, generateMarkdown(doc));
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "component-docs-md.zip");
  };

  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null);

  const handleUploadToSupabase = async () => {
    setIsUploading(true);
    setUploadResult(null);

    const supabase = createClient();
    let successCount = 0;
    let failedCount = 0;

    for (const doc of docs) {
      // Transform ComponentDoc to match database schema
      const dbRecord = {
        id: doc.slug, // Use slug as ID for easy lookup
        name: doc.name,
        slug: doc.slug,
        group: doc.group,
        description: doc.description,
        tree: doc.tree,
        properties: doc.properties,
        css: doc.css,
        tokens: doc.tokens,
        contains: doc.contains,
        used_by: doc.usedBy,
        variants: doc.variants.reduce((acc, v) => {
          acc[v.propertyLabel.toLowerCase()] = v.options;
          return acc;
        }, {} as Record<string, { label: string; value: string }[]>),
        render_raw: doc.renderRaw,
        css_raw: doc.cssRaw,
        breakpoints: doc.breakpoints,
        embeds: doc.embeds,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("component_docs")
        .upsert(dbRecord, { onConflict: "slug" });

      if (error) {
        console.error(`Failed to upload ${doc.name}:`, error);
        failedCount++;
      } else {
        successCount++;
      }
    }

    setUploadResult({ success: successCount, failed: failedCount });
    setIsUploading(false);
  };

  const generateAISummary = (): string => {
    const lines: string[] = [];
    lines.push("# Component Library Summary");
    lines.push(`> ${docs.length} components | ${totalProps} props | ${totalTokens} tokens | ${totalStyles} CSS classes`);
    lines.push("");

    // Group summary
    for (const groupName of sortedGroups) {
      const groupDocs = groups.get(groupName)!;
      lines.push(`## ${groupName} (${groupDocs.length})`);

      for (const doc of groupDocs.sort((a, b) => a.name.localeCompare(b.name))) {
        // Component name and basic info
        const variantCount = doc.variants.length;
        const propCount = doc.stats.propertyCount;
        const tokenCount = doc.stats.tokenCount;

        let info = `- **${doc.name}**`;
        const details: string[] = [];
        if (variantCount > 0) details.push(`${variantCount}v`);
        if (propCount > 0) details.push(`${propCount}p`);
        if (tokenCount > 0) details.push(`${tokenCount}t`);
        if (details.length > 0) info += ` [${details.join("/")}]`;

        // Add variants inline if any
        if (doc.variants.length > 0) {
          const variantStrs = doc.variants.map(v =>
            `${v.propertyLabel}: ${v.options.map(o => o.label).join("|")}`
          );
          info += ` — ${variantStrs.join("; ")}`;
        }

        // Add contains if any
        if (doc.contains.length > 0) {
          info += ` → contains: ${doc.contains.join(", ")}`;
        }

        lines.push(info);
      }
      lines.push("");
    }

    // Add errors if any
    if (errors.length > 0) {
      lines.push("## Failed Components");
      for (const err of errors) {
        lines.push(`- **${err.componentName}**: ${err.error}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  };

  const handleCopySummary = async () => {
    const summary = generateAISummary();
    await navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl text-text-primary mb-2">
          Documentation Generated
        </h2>
        <p className="text-text-muted">
          {docs.length} components processed successfully
          {errors.length > 0 && (
            <span className="text-red-400 ml-2">
              ({errors.length} failed)
            </span>
          )}
        </p>
      </div>

      {/* Errors Panel */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8">
          <h3 className="font-medium text-red-400 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {errors.length} Component{errors.length === 1 ? "" : "s"} Failed to Process
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {errors.map((err, idx) => (
              <div key={idx} className="bg-background/50 rounded-lg p-3 text-sm">
                <div className="font-medium text-text-primary mb-1">
                  {err.componentName}
                  <span className="text-text-dim ml-2 font-mono text-xs">
                    {err.componentId}
                  </span>
                </div>
                <div className="text-red-300 font-mono text-xs mb-2">
                  {err.error}
                </div>
                {err.stack && (
                  <details className="text-text-dim">
                    <summary className="cursor-pointer hover:text-text-muted text-xs">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
                      {err.stack}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Components", value: docs.length },
          { label: "Properties", value: totalProps },
          { label: "Tokens", value: totalTokens },
          { label: "CSS Classes", value: totalStyles },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface border border-border rounded-xl p-4 text-center"
          >
            <div className="text-2xl font-semibold text-text-primary">
              {stat.value}
            </div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className={`rounded-lg p-4 mb-4 ${
          uploadResult.failed === 0
            ? "bg-green-500/10 border border-green-500/30"
            : "bg-yellow-500/10 border border-yellow-500/30"
        }`}>
          <p className={`text-sm ${uploadResult.failed === 0 ? "text-green-400" : "text-yellow-400"}`}>
            {uploadResult.failed === 0
              ? `✓ Successfully uploaded ${uploadResult.success} components to Supabase`
              : `Uploaded ${uploadResult.success} components, ${uploadResult.failed} failed`}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <Button onClick={handleUploadToSupabase} disabled={isUploading}>
          {isUploading ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload to Supabase
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleDownloadAllJson}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download JSON
        </Button>
        <Button variant="outline" onClick={handleDownloadAllMd}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Markdown
        </Button>
        <Button variant="ghost" onClick={handleCopySummary}>
          {copiedSummary ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy AI Summary
            </>
          )}
        </Button>
      </div>

      {/* Component List */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {sortedGroups.map((groupName) => {
          const groupDocs = groups.get(groupName)!;
          return (
            <div key={groupName}>
              <div className="px-4 py-2 bg-border/30 text-xs font-medium text-text-muted uppercase tracking-wider">
                {groupName} ({groupDocs.length})
              </div>
              {groupDocs
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((doc) => (
                  <ComponentRow key={doc.slug} doc={doc} />
                ))}
            </div>
          );
        })}
      </div>

      {/* Start Over */}
      <div className="flex justify-center pt-4">
        <Button variant="ghost" onClick={onStartOver}>
          Start Over
        </Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════

export default function DocGeneratorPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [docs, setDocs] = useState<ComponentDoc[]>([]);
  const [errors, setErrors] = useState<GenerationError[]>([]);

  const handleProcess = (generatedDocs: ComponentDoc[], generationErrors: GenerationError[]) => {
    setDocs(generatedDocs);
    setErrors(generationErrors);
    setStep(3);
  };

  const handleStartOver = () => {
    setDocs([]);
    setErrors([]);
    setStep(1);
  };

  return (
    <PageTransition>
      <GridBackground />
      <CursorGlow />
      <Navbar />
      <main className="min-h-screen pt-24 md:pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl text-text-primary leading-tight mb-4">
              Documentation Generator
            </h1>
            <p className="text-text-muted max-w-xl mx-auto">
              Extract component data from Webflow and generate documentation files
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={step} />

          {/* Step Content */}
          <div className="bg-surface/50 border border-border rounded-2xl p-6 md:p-8">
            {step === 1 && <Step1CopyScript onNext={() => setStep(2)} />}
            {step === 2 && (
              <Step2PasteOutput
                onBack={() => setStep(1)}
                onProcess={handleProcess}
              />
            )}
            {step === 3 && (
              <Step3Results docs={docs} errors={errors} onStartOver={handleStartOver} />
            )}
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
