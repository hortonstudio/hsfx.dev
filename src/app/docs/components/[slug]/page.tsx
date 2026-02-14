"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { marked } from "marked";
import { createClient } from "@/lib/supabase/client";
import {
  Breadcrumb,
  ComponentHeader,
  WebflowNavigator,
  WebflowProperties,
  CodeEditor,
  DesignTokensTable,
  PropertyAttributeMap,
  DependencyGraph,
  RichTextBlock,
  Callout,
  DocRightSidebar,
  Spinner,
  type TreeNode,
  type PropertySection,
  type DesignToken,
  type PropertyMapping,
  type TableOfContentsItem,
} from "@/components/ui";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useDocSection } from "@/contexts/DocSectionContext";
import { generateComponentMarkdown } from "@/lib/docs/generateMarkdown";

interface UsageData {
  description?: string;
  whenToUse?: string;
  patterns?: string;
  variantGuide?: string;
  gotchas?: string;
  notes?: string;
}

interface ComponentDoc {
  id: string;
  name: string;
  slug: string;
  group: string | null;
  description: string | null;
  tree: TreeNode[] | null;
  properties: PropertySection[] | null;
  css: string | null;
  tokens: DesignToken[] | null;
  contains: string[] | null;
  used_by: string[] | null;
  variants: {
    style?: Array<{ label: string; value: string }>;
    size?: Array<{ label: string; value: string }>;
    [key: string]: Array<{ label: string; value: string }> | undefined;
  } | null;
  embeds: {
    usageNotes?: string;
    propertyMappings?: PropertyMapping[];
  } | null;
  usage: UsageData | null;
}

const USAGE_SECTIONS = [
  { key: "description" as const, label: "Description", id: "usage-description" },
  { key: "whenToUse" as const, label: "When to Use", id: "usage-when" },
  { key: "patterns" as const, label: "Common Patterns", id: "usage-patterns" },
  { key: "variantGuide" as const, label: "Variant Guide", id: "usage-variants" },
  { key: "gotchas" as const, label: "Gotchas", id: "usage-gotchas" },
  { key: "notes" as const, label: "Additional Notes", id: "usage-notes" },
];

const tableOfContents: TableOfContentsItem[] = [
  { id: "structure", label: "Structure & Properties", level: 1 },
  { id: "css", label: "CSS", level: 1 },
  { id: "tokens", label: "Design Tokens", level: 1 },
  { id: "attributes", label: "Property-Attribute Map", level: 1 },
  { id: "dependencies", label: "Dependencies", level: 1 },
  { id: "usage", label: "Usage Notes", level: 1 },
  { id: "usage-guide", label: "Usage Guide", level: 1 },
];

const sectionIds = tableOfContents.map((item) => item.id);

export default function ComponentDocPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [component, setComponent] = useState<ComponentDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedNode, setSelectedNode] = useState<string>("");

  const currentSection = useActiveSection(sectionIds);
  const { setCurrentSection } = useDocSection();

  useEffect(() => {
    setCurrentSection(currentSection);
  }, [currentSection, setCurrentSection]);

  useEffect(() => {
    async function fetchComponent() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("component_docs")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("Error fetching component:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Component not found");
        setLoading(false);
        return;
      }

      setComponent(data as ComponentDoc);

      // Initialize selected variants
      const initialVariants: Record<string, string> = {};
      if (data.variants) {
        Object.entries(data.variants).forEach(([key, options]) => {
          if (Array.isArray(options) && options.length > 0) {
            initialVariants[key.charAt(0).toUpperCase() + key.slice(1)] = options[0].value;
          }
        });
      }
      setSelectedVariants(initialVariants);

      // Initialize selected node
      if (data.tree && data.tree.length > 0) {
        setSelectedNode(data.tree[0].id);
      }

      setLoading(false);
    }

    fetchComponent();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !component) {
    notFound();
  }

  const breadcrumbItems = [
    { label: "Docs", href: "/docs" },
    { label: "Components", href: "/docs/components" },
    ...(component.group ? [{ label: component.group, href: "/docs/components" }] : []),
    { label: component.name },
  ];

  const variants = component.variants
    ? Object.entries(component.variants).map(([key, options]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        options: options || [],
      }))
    : [];

  const handleVariantChange = (label: string, value: string) => {
    setSelectedVariants((prev) => ({ ...prev, [label]: value }));
  };

  const getMarkdown = () => generateComponentMarkdown(component);

  const handleDownloadMd = () => {
    const content = getMarkdown();
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${component.slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMd = () => {
    const content = getMarkdown();
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex gap-8">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-12">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Component Header */}
        <ComponentHeader
          name={component.name}
          group={component.group}
          description={component.description}
          variants={variants}
          selectedVariants={selectedVariants}
          onVariantChange={handleVariantChange}
        />

        {/* Structure & Properties */}
        {(component.tree || component.properties) && (
          <section id="structure">
            <h2 className="font-serif text-2xl font-bold text-text-primary mb-6 scroll-mt-20">
              Structure & Properties
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {component.tree && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-surface border-b border-border">
                    <h3 className="text-sm font-medium text-text-primary">Element Tree</h3>
                  </div>
                  <div className="p-4">
                    <WebflowNavigator
                      nodes={component.tree}
                      selectedId={selectedNode}
                      onSelect={setSelectedNode}
                    />
                  </div>
                </div>
              )}
              {component.properties && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-surface border-b border-border">
                    <h3 className="text-sm font-medium text-text-primary">Properties</h3>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto" data-lenis-prevent>
                    <WebflowProperties sections={component.properties} />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* CSS */}
        {component.css && (
          <section id="css">
            <h2 className="font-serif text-2xl font-bold text-text-primary mb-6 scroll-mt-20">
              CSS
            </h2>
            <CodeEditor value={component.css} language="css" readOnly height="400px" />
          </section>
        )}

        {/* Design Tokens */}
        {component.tokens && component.tokens.length > 0 && (
          <section id="tokens">
            <h2 className="font-serif text-2xl font-bold text-text-primary mb-6 scroll-mt-20">
              Design Tokens
            </h2>
            <Callout variant="tip" title="Variant Highlighting">
              <p>
                Click on a variant column header to highlight it. System tokens (Theme/, Trigger/)
                are shown with dimmed headers.
              </p>
            </Callout>
            <div className="mt-4 border border-border rounded-lg overflow-hidden">
              <DesignTokensTable
                tokens={component.tokens}
                highlightVariant={
                  selectedVariants.Style && selectedVariants.Style !== "primary"
                    ? selectedVariants.Style.charAt(0).toUpperCase() +
                      selectedVariants.Style.slice(1)
                    : undefined
                }
              />
            </div>
          </section>
        )}

        {/* Property-Attribute Map */}
        {component.embeds?.propertyMappings && component.embeds.propertyMappings.length > 0 && (
          <section id="attributes">
            <h2 className="font-serif text-2xl font-bold text-text-primary mb-6 scroll-mt-20">
              Property-Attribute Map
            </h2>
            <div className="border border-border rounded-lg overflow-hidden">
              <PropertyAttributeMap mappings={component.embeds.propertyMappings} />
            </div>
          </section>
        )}

        {/* Dependencies */}
        {(component.contains || component.used_by) && (
          <section id="dependencies">
            <h2 className="font-serif text-2xl font-bold text-text-primary mb-6 scroll-mt-20">
              Dependencies
            </h2>
            <div className="border border-border rounded-lg p-6">
              <DependencyGraph
                componentName={component.name}
                contains={component.contains || []}
                usedBy={component.used_by || []}
                onNavigate={(name) => console.log("Navigate to:", name)}
              />
            </div>
          </section>
        )}

        {/* Usage Notes */}
        {component.embeds?.usageNotes && (
          <section id="usage">
            <h2 className="font-serif text-2xl font-bold text-text-primary mb-6 scroll-mt-20">
              Usage Notes
            </h2>
            <div className="border border-border rounded-lg p-6">
              <RichTextBlock html={component.embeds.usageNotes} />
            </div>
          </section>
        )}

        {/* Usage Guide (manually authored) */}
        {component.usage && Object.values(component.usage).some(v => v?.trim()) && (
          <section id="usage-guide">
            <h2 className="font-serif text-2xl font-bold text-text-primary mb-6 scroll-mt-20">
              Usage Guide
            </h2>
            <div className="space-y-8">
              {USAGE_SECTIONS.map(({ key, label, id }) => {
                const content = component.usage?.[key];
                if (!content?.trim()) return null;
                return (
                  <div key={id} id={id} className="scroll-mt-20">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                      {label}
                    </h3>
                    <div className="border border-border rounded-lg p-6">
                      <RichTextBlock html={marked.parse(content) as string} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Right sidebar */}
      <DocRightSidebar
        tableOfContents={tableOfContents}
        currentSection={currentSection}
        onDownloadMd={handleDownloadMd}
        onCopyMd={handleCopyMd}
        prevPage={{ label: "Getting Started", href: "/docs/getting-started" }}
      />
    </div>
  );
}
