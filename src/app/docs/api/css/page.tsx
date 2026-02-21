"use client";

import { useEffect } from "react";
import {
  Breadcrumb,
  Badge,
  Callout,
  CodeBlockWithCopy,
  DocRightSidebar,
} from "@/components/ui";
import { ApiPlayground } from "@/components/ui/ApiPlayground";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useDocSection } from "@/contexts/DocSectionContext";
import { brand } from "@/config";
import { cssApiData } from "@/lib/docs/apiData";
import { generateApiMarkdown } from "@/lib/docs/generateApiMarkdown";

const breadcrumbItems = [
  { label: "Docs", href: "/docs" },
  { label: "API Reference", href: "/docs/api" },
  { label: "CSS API" },
];

const sectionIds = [
  "overview",
  "authentication",
  "parameters",
  "responses",
  "examples",
  "playground",
];

const tableOfContents = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "parameters", label: "Parameters" },
  { id: "responses", label: "Responses" },
  { id: "examples", label: "Examples" },
  { id: "playground", label: "Try It Out" },
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

const jsFetchExample = `const response = await fetch(
  "https://${brand.domain}/api/css?group=global&combined=true&minified=true",
  {
    headers: {
      "x-api-key": process.env.CSS_API_KEY,
    },
  }
);

const css = await response.text();
// Inject into page
const style = document.createElement("style");
style.textContent = css;
document.head.appendChild(style);`;

export default function CssApiDocPage() {
  const activeSection = useActiveSection(sectionIds);
  const { setCurrentSection } = useDocSection();

  useEffect(() => {
    setCurrentSection(activeSection);
  }, [activeSection, setCurrentSection]);

  const handleDownloadMd = () => {
    const md = generateApiMarkdown(cssApiData);
    downloadTextFile(`${brand.dataPrefix}-css-api.md`, md);
  };

  const handleCopyMd = () => {
    const md = generateApiMarkdown(cssApiData);
    navigator.clipboard.writeText(md);
  };

  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-0 space-y-12">
        <Breadcrumb items={breadcrumbItems} />

        {/* Title */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="default">GET</Badge>
            <code className="text-sm text-text-muted">{cssApiData.endpoint}</code>
          </div>
          <h1 className="font-serif text-4xl font-bold text-text-primary mb-4">
            CSS API
          </h1>
          <p className="text-lg text-text-secondary max-w-3xl">
            {cssApiData.description}
          </p>
        </div>

        {/* Overview */}
        <section id="overview">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 scroll-mt-20">
            Overview
          </h2>
          <p className="text-text-secondary mb-4">
            The CSS API serves design system CSS stored in Supabase. It supports
            fetching individual CSS entries, combining all entries in a group
            into a single stylesheet, and returning minified output for
            production use.
          </p>
          <p className="text-text-secondary">
            For combined requests, the API uses a pre-computed cache table
            (<code className="px-1.5 py-0.5 bg-surface border border-border rounded text-sm">
              css_groups
            </code>) for fast responses. This means combined+minified requests
            are served from cache rather than computed on each request.
          </p>
        </section>

        {/* Authentication */}
        <section id="authentication">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 scroll-mt-20">
            Authentication
          </h2>
          <p className="text-text-secondary mb-4">
            Include your API key in the{" "}
            <code className="px-1.5 py-0.5 bg-surface border border-border rounded text-sm">
              x-api-key
            </code>{" "}
            request header. Requests without a valid key receive a{" "}
            <code className="px-1.5 py-0.5 bg-surface border border-border rounded text-sm">
              401 Unauthorized
            </code>{" "}
            response.
          </p>

          <Callout variant="warning" title="API Key Required">
            <p>
              The CSS API requires its own dedicated key, separate from the Icons
              API key. Store your key in an environment variable and never expose
              it in client-side code.
            </p>
          </Callout>
        </section>

        {/* Parameters */}
        <section id="parameters">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 scroll-mt-20">
            Parameters
          </h2>
          <p className="text-text-secondary mb-4">
            All parameters are passed as URL query parameters.
          </p>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface/50 border-b border-border">
                  <th className="text-left px-4 py-2.5 font-medium text-text-secondary">
                    Parameter
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-secondary">
                    Type
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-secondary">
                    Required
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-secondary">
                    Default
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-secondary">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {cssApiData.parameters.map((param) => (
                  <tr
                    key={param.name}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-accent">
                      {param.name}
                    </td>
                    <td className="px-4 py-2.5 text-text-muted">
                      {param.type}
                    </td>
                    <td className="px-4 py-2.5">
                      {param.required ? (
                        <Badge variant="error">Required</Badge>
                      ) : (
                        <span className="text-text-dim">Optional</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-text-dim">
                      {param.default || "-"}
                    </td>
                    <td className="px-4 py-2.5 text-text-muted">
                      {param.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Responses */}
        <section id="responses">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 scroll-mt-20">
            Responses
          </h2>
          <p className="text-text-secondary mb-6">
            The response format depends on the request parameters. Single-entry
            and combined requests return raw CSS. Multi-entry requests without{" "}
            <code className="px-1.5 py-0.5 bg-surface border border-border rounded text-sm">
              combined=true
            </code>{" "}
            return a JSON array.
          </p>

          <div className="space-y-6">
            {cssApiData.responseFormats.map((format) => (
              <div key={format.label}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-text-primary text-sm">
                    {format.label}
                  </h3>
                  <Badge variant="default">{format.contentType}</Badge>
                </div>
                <CodeBlockWithCopy
                  code={format.example}
                  language={
                    format.contentType.includes("css") ? "css" : "json"
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* Examples */}
        <section id="examples">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 scroll-mt-20">
            Examples
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-text-primary text-sm mb-3">
                cURL Examples
              </h3>
              <div className="space-y-4">
                {cssApiData.curlExamples.map((example) => (
                  <CodeBlockWithCopy
                    key={example.label}
                    code={example.command}
                    language="bash"
                    filename={example.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-text-primary text-sm mb-3">
                JavaScript (fetch)
              </h3>
              <CodeBlockWithCopy
                code={jsFetchExample}
                language="javascript"
                filename="Fetch and inject CSS"
              />
            </div>
          </div>

          <div className="mt-6">
            <Callout variant="note" title="CORS">
              <p>
                The CSS API allows requests from any origin (
                <code>Access-Control-Allow-Origin: *</code>). You can call it
                directly from client-side JavaScript, but remember to keep your
                API key secure by proxying requests through your backend.
              </p>
            </Callout>
          </div>
        </section>

        {/* Playground */}
        <section id="playground">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 scroll-mt-20">
            Try It Out
          </h2>
          <p className="text-text-secondary mb-6">
            Test the CSS API directly from your browser. Requests are proxied
            through the server so no API key is needed here.
          </p>

          <ApiPlayground
            apiName="css"
            parameters={cssApiData.parameters}
            endpoint={cssApiData.endpoint}
          />
        </section>

        {/* Prev/Next */}
        <nav className="flex items-center justify-between pt-8 border-t border-border">
          <a
            href="/docs/api"
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
              <div className="font-medium">API Overview</div>
            </div>
          </a>
          <a
            href="/docs/api/icons"
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-right"
          >
            <div>
              <div className="text-xs text-text-muted">Next</div>
              <div className="font-medium">Icons API</div>
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
        onDownloadMd={handleDownloadMd}
        onCopyMd={handleCopyMd}
        prevPage={{ label: "API Overview", href: "/docs/api" }}
        nextPage={{ label: "Icons API", href: "/docs/api/icons" }}
      />
    </div>
  );
}
