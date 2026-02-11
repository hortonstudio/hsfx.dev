"use client";

import { useState, useCallback } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import Navbar from "@/components/layout/Navbar";
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

import { generateDocs, validateExtractorOutput } from "@/lib/doc-generator/generator";
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

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="border-b border-border px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-text-muted">component-extractor.js</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy Script"}
          </Button>
        </div>
        <CodeEditor
          value={EXTRACTOR_SCRIPT}
          language="javascript"
          readOnly
          height="400px"
          lineNumbers
        />
      </div>

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
  onProcess: (docs: ComponentDoc[]) => void;
}) {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleProcess = useCallback(async () => {
    setError(null);
    setIsProcessing(true);
    setProgress(0);

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
      const docs = generateDocs(data as ExtractorOutput);

      setProgress(100);
      await new Promise((r) => setTimeout(r, 200));

      onProcess(docs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred");
      setIsProcessing(false);
    }
  }, [jsonInput, onProcess]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl text-text-primary mb-2">
          Paste Extractor Output
        </h2>
        <p className="text-text-muted">
          Paste the JSON output from the extractor script
        </p>
      </div>

      <div className="relative">
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Paste the JSON output here..."
          className="w-full h-96 p-4 bg-background border border-border rounded-xl
            font-mono text-sm text-text-primary placeholder:text-text-dim
            focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
            resize-none"
          disabled={isProcessing}
        />
        {jsonInput && (
          <div className="absolute bottom-4 right-4 text-xs text-text-dim">
            {jsonInput.length.toLocaleString()} characters
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-400 mb-1">Error</h4>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {isProcessing && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
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
          <p className="text-sm text-text-muted mt-2">Processing components...</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isProcessing}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <Button
          onClick={handleProcess}
          disabled={!jsonInput.trim() || isProcessing}
        >
          {isProcessing ? "Processing..." : "Process"}
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
  onStartOver,
}: {
  docs: ComponentDoc[];
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

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl text-text-primary mb-2">
          Documentation Generated
        </h2>
        <p className="text-text-muted">
          {docs.length} components processed successfully
        </p>
      </div>

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

      {/* Download Buttons */}
      <div className="flex justify-center gap-4 mb-8">
        <Button onClick={handleDownloadAllJson}>
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

  const handleProcess = (generatedDocs: ComponentDoc[]) => {
    setDocs(generatedDocs);
    setStep(3);
  };

  const handleStartOver = () => {
    setDocs([]);
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
              <Step3Results docs={docs} onStartOver={handleStartOver} />
            )}
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
