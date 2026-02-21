"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  Callout,
  CodeBlockWithCopy,
  DocRightSidebar,
  Badge,
} from "@/components/ui";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useDocSection } from "@/contexts/DocSectionContext";
import { brand } from "@/config";
import { allApiData } from "@/lib/docs/apiData";
import {
  generateApiIndexMarkdown,
  generateApiAISummary,
} from "@/lib/docs/generateApiMarkdown";

const breadcrumbItems = [
  { label: "Docs", href: "/docs" },
  { label: "API Reference" },
];

const sectionIds = [
  "available-apis",
  "authentication",
  "rate-limits",
  "download-guides",
];

const tableOfContents = [
  { id: "available-apis", label: "Available APIs" },
  { id: "authentication", label: "Authentication" },
  { id: "rate-limits", label: "Rate Limits & Caching" },
  { id: "download-guides", label: "Download Guides" },
];

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ApiDocsIndexPage() {
  const activeSection = useActiveSection(sectionIds);
  const { setCurrentSection } = useDocSection();

  useEffect(() => {
    setCurrentSection(activeSection);
  }, [activeSection, setCurrentSection]);

  const handleDownloadIndex = () => {
    const md = generateApiIndexMarkdown(allApiData);
    downloadTextFile(`${brand.dataPrefix}-api-reference.md`, md);
  };

  const handleDownloadAISummary = () => {
    const md = generateApiAISummary(allApiData);
    downloadTextFile(`${brand.dataPrefix}-api-ai-summary.md`, md);
  };

  const handleCopyMd = () => {
    const md = generateApiIndexMarkdown(allApiData);
    navigator.clipboard.writeText(md);
  };

  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-0 space-y-12">
        <Breadcrumb items={breadcrumbItems} />

        {/* Title */}
        <div>
          <h1 className="font-serif text-4xl font-bold text-text-primary mb-4">
            API Reference
          </h1>
          <p className="text-lg text-text-secondary max-w-3xl">
            Comprehensive guides for integrating with {brand.name} APIs. Each
            API includes authentication details, parameter references, code
            examples, and interactive playgrounds.
          </p>
        </div>

        {/* Available APIs */}
        <section id="available-apis">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-6 scroll-mt-20">
            Available APIs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allApiData.map((api) => (
              <Link
                key={api.slug}
                href={`/docs/api/${api.slug}`}
                className="block p-5 border border-border rounded-lg hover:border-accent/50 hover:bg-surface/50 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">{api.method}</Badge>
                  <h3 className="font-medium text-text-primary group-hover:text-accent transition-colors">
                    {api.name}
                  </h3>
                </div>
                <code className="text-xs text-text-dim block mb-2">
                  {api.endpoint}
                </code>
                <p className="text-sm text-text-muted">
                  {api.description.split(".")[0]}.
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Authentication */}
        <section id="authentication">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 scroll-mt-20">
            Authentication
          </h2>

          <p className="text-text-secondary mb-4">
            All {brand.name} APIs require authentication via an{" "}
            <code className="px-1.5 py-0.5 bg-surface border border-border rounded text-sm">
              x-api-key
            </code>{" "}
            header. Each API has its own key. Contact the team to obtain your API
            keys.
          </p>

          <Callout variant="warning" title="Keep your keys secure">
            <p>
              API keys should never be exposed in client-side code or public
              repositories. Use server-side requests or environment variables to
              keep your keys safe.
            </p>
          </Callout>

          <div className="mt-4">
            <CodeBlockWithCopy
              code={`curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/css?group=global&combined=true"`}
              language="bash"
              filename="Example Request"
            />
          </div>
        </section>

        {/* Rate Limits & Caching */}
        <section id="rate-limits">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 scroll-mt-20">
            Rate Limits & Caching
          </h2>

          <p className="text-text-secondary mb-4">
            There are no hard rate limits on API requests. However, all
            responses include caching headers for optimal performance:
          </p>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface/50 border-b border-border">
                  <th className="text-left px-4 py-2 font-medium text-text-secondary">
                    Header
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-text-secondary">
                    Value
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-text-secondary">
                    Meaning
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-mono text-xs text-text-primary">
                    max-age
                  </td>
                  <td className="px-4 py-2 text-text-muted">60</td>
                  <td className="px-4 py-2 text-text-muted">
                    Browser caches for 60 seconds
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs text-text-primary">
                    s-maxage
                  </td>
                  <td className="px-4 py-2 text-text-muted">300</td>
                  <td className="px-4 py-2 text-text-muted">
                    CDN caches for 5 minutes
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout variant="tip" title="Performance Tip">
            <p>
              The CSS API supports a{" "}
              <code>combined=true&minified=true</code> mode that serves
              pre-computed minified CSS from a cache table, making it the fastest
              way to fetch group CSS.
            </p>
          </Callout>
        </section>

        {/* Download Guides */}
        <section id="download-guides">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 scroll-mt-20">
            Download Guides
          </h2>

          <p className="text-text-secondary mb-6">
            Download comprehensive markdown guides for AI consumption or offline
            reference. These files contain complete API specifications, example
            requests, and integration patterns.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadIndex}
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-accent/50 hover:bg-surface/50 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-accent"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-text-primary text-sm">
                  API Reference (MD)
                </div>
                <div className="text-xs text-text-muted">
                  Complete reference for all APIs
                </div>
              </div>
            </button>

            <button
              onClick={handleDownloadAISummary}
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-accent/50 hover:bg-surface/50 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-accent"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-text-primary text-sm">
                  AI Summary (MD)
                </div>
                <div className="text-xs text-text-muted">
                  Compact reference optimized for AI assistants
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Prev/Next Navigation */}
        <nav className="flex items-center justify-between pt-8 border-t border-border">
          <a
            href="/docs/first-page"
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <div>
              <div className="text-xs text-text-muted">Previous</div>
              <div className="font-medium">Building Your First Page</div>
            </div>
          </a>
          <a
            href="/docs/api/css"
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-right"
          >
            <div>
              <div className="text-xs text-text-muted">Next</div>
              <div className="font-medium">CSS API</div>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        </nav>
      </div>

      {/* Right Sidebar */}
      <DocRightSidebar
        tableOfContents={tableOfContents}
        currentSection={activeSection}
        onDownloadMd={handleDownloadIndex}
        onCopyMd={handleCopyMd}
        prevPage={{ label: "Building Your First Page", href: "/docs/first-page" }}
        nextPage={{ label: "CSS API", href: "/docs/api/css" }}
      />
    </div>
  );
}
