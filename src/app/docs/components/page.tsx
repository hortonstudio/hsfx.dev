"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Breadcrumb, Spinner, Badge, Button } from "@/components/ui";
import {
  generateComponentMarkdown,
  generateIndexMarkdown,
  generateAISummary,
  type ComponentDocData,
} from "@/lib/docs/generateMarkdown";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { brand } from "@/config";

interface ComponentSummary {
  id: string;
  name: string;
  slug: string;
  group: string | null;
  description: string | null;
}

const breadcrumbItems = [
  { label: "Docs", href: "/docs" },
  { label: "Components" },
];

export default function ComponentsIndexPage() {
  const [components, setComponents] = useState<ComponentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAI, setIsDownloadingAI] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function fetchComponents() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("component_docs")
        .select("id, name, slug, group, description")
        .order("group")
        .order("name");

      if (error) {
        console.error("Error fetching components:", error);
        setLoading(false);
        return;
      }

      setComponents(data || []);
      setLoading(false);
    }

    fetchComponents();
  }, []);

  const fetchAllComponentDocs = async (): Promise<ComponentDocData[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("component_docs")
      .select("name, slug, group, description, tree, properties, css, tokens, contains, used_by, variants")
      .order("group")
      .order("name");

    if (error) {
      console.error("Error fetching full component docs:", error);
      return [];
    }

    return (data || []) as ComponentDocData[];
  };

  const handleDownloadAllMd = async () => {
    setIsDownloading(true);
    try {
      const docs = await fetchAllComponentDocs();
      if (docs.length === 0) return;

      const zip = new JSZip();

      // Add index file
      zip.file("_index.md", generateIndexMarkdown(docs));

      // Add each component
      for (const doc of docs) {
        zip.file(`${doc.slug}.md`, generateComponentMarkdown(doc));
      }

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, "component-docs.zip");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyAllMd = async () => {
    setIsCopying(true);
    try {
      const docs = await fetchAllComponentDocs();
      if (docs.length === 0) return;

      // Generate combined markdown
      const parts: string[] = [];
      parts.push(generateIndexMarkdown(docs));
      parts.push("\n---\n");

      for (const doc of docs) {
        parts.push(generateComponentMarkdown(doc));
        parts.push("\n---\n");
      }

      await navigator.clipboard.writeText(parts.join("\n"));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } finally {
      setIsCopying(false);
    }
  };

  const handleDownloadAISummary = async () => {
    setIsDownloadingAI(true);
    try {
      const docs = await fetchAllComponentDocs();
      if (docs.length === 0) return;

      const summary = generateAISummary(docs);
      const blob = new Blob([summary], { type: "text/markdown" });
      saveAs(blob, `${brand.dataPrefix}-components-ai-summary.md`);
    } finally {
      setIsDownloadingAI(false);
    }
  };

  // Group components by their group field
  const groupedComponents = components.reduce(
    (acc, comp) => {
      const group = comp.group || "Ungrouped";
      if (!acc[group]) acc[group] = [];
      acc[group].push(comp);
      return acc;
    },
    {} as Record<string, ComponentSummary[]>
  );

  const sortedGroups = Object.keys(groupedComponents).sort();

  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Title */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="font-serif text-4xl font-bold text-text-primary">
            Components
          </h1>
          {!loading && components.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAISummary}
                disabled={isDownloadingAI}
              >
                {isDownloadingAI ? "Generating..." : "AI Summary"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAllMd}
                disabled={isCopying}
              >
                {copySuccess ? "Copied!" : isCopying ? "Copying..." : "Copy All MD"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAllMd}
                disabled={isDownloading}
              >
                {isDownloading ? "Downloading..." : "Download All MD"}
              </Button>
            </div>
          )}
        </div>
        <p className="text-lg text-text-secondary max-w-3xl">
          Browse all available {brand.name} components. Each component includes structure documentation, CSS, design tokens, and usage notes.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty State */}
      {!loading && components.length === 0 && (
        <div className="text-center py-20 border border-border rounded-lg">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="font-serif text-xl font-bold text-text-primary mb-2">
            No components yet
          </h3>
          <p className="text-text-muted max-w-md mx-auto">
            Component documentation will appear here once generated using the{" "}
            <Link href="/tools/doc-generator" className="text-accent hover:text-accent-hover">
              Doc Generator
            </Link>{" "}
            tool.
          </p>
        </div>
      )}

      {/* Component Groups */}
      {!loading && components.length > 0 && (
        <div className="space-y-10">
          {sortedGroups.map((group) => (
            <section key={group}>
              <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
                {group}
                <Badge variant="default">{groupedComponents[group].length}</Badge>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedComponents[group].map((comp) => (
                  <Link
                    key={comp.id}
                    href={`/docs/components/${comp.slug}`}
                    className="group block p-4 border border-border rounded-lg hover:border-accent/50 hover:bg-surface/50 transition-all"
                  >
                    <h3 className="font-medium text-text-primary group-hover:text-accent transition-colors mb-1">
                      {comp.name}
                    </h3>
                    {comp.description && (
                      <p className="text-sm text-text-muted line-clamp-2">
                        {comp.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {!loading && components.length > 0 && (
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-text-muted">
            {components.length} components across {sortedGroups.length} groups
          </p>
        </div>
      )}
    </div>
  );
}
