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
import { iconsApiData } from "@/lib/docs/apiData";
import { generateApiMarkdown } from "@/lib/docs/generateApiMarkdown";

const breadcrumbItems = [
  { label: "Docs", href: "/docs" },
  { label: "API Reference", href: "/docs/api" },
  { label: "Icons API" },
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
  "https://${brand.domain}/api/icons?group=contact",
  {
    headers: {
      "x-api-key": process.env.ICONS_API_KEY,
    },
  }
);

const { groups, icons } = await response.json();

// Render icons into a container
const container = document.getElementById("icon-grid");
icons.forEach((icon) => {
  const div = document.createElement("div");
  div.innerHTML = icon.svg;
  div.title = icon.name;
  container.appendChild(div);
});`;

export default function IconsApiDocPage() {
  const activeSection = useActiveSection(sectionIds);
  const { setCurrentSection } = useDocSection();

  useEffect(() => {
    setCurrentSection(activeSection);
  }, [activeSection, setCurrentSection]);

  const handleDownloadMd = () => {
    const md = generateApiMarkdown(iconsApiData);
    downloadTextFile(`${brand.dataPrefix}-icons-api.md`, md);
  };

  const handleCopyMd = () => {
    const md = generateApiMarkdown(iconsApiData);
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
            <code className="text-sm text-text-muted">
              {iconsApiData.endpoint}
            </code>
          </div>
          <h1 className="font-serif text-4xl font-bold text-text-primary mb-4">
            Icons API
          </h1>
          <p className="text-lg text-text-secondary max-w-3xl">
            {iconsApiData.description}
          </p>
        </div>

        {/* Overview */}
        <section id="overview">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 scroll-mt-20">
            Overview
          </h2>
          <p className="text-text-secondary mb-4">
            The Icons API provides access to the {brand.name} SVG icon library
            stored in Supabase. Icons are organized by groups (e.g.
            &quot;contact&quot;, &quot;general&quot;, &quot;social&quot;) and
            returned as inline SVG strings ready for rendering.
          </p>
          <p className="text-text-secondary">
            The response includes both a list of available groups and all
            matching icons with their SVG content. This allows you to build icon
            pickers, search UIs, or inject icons directly into your pages.
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
            request header. The Icons API uses a separate key from the CSS API.
          </p>

          <Callout variant="warning" title="API Key Required">
            <p>
              Requests without a valid key receive a{" "}
              <code>401 Unauthorized</code> response. Store your key in an
              environment variable and never expose it in client-side code.
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
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {iconsApiData.parameters.map((param) => (
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
                      <span className="text-text-dim">Optional</span>
                    </td>
                    <td className="px-4 py-2.5 text-text-muted">
                      {param.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout variant="tip" title="Tip">
            <p>
              Omit the <code>group</code> parameter to fetch all icons across
              all groups in a single request. The response includes a{" "}
              <code>groups</code> array you can use to build a filter UI.
            </p>
          </Callout>
        </section>

        {/* Responses */}
        <section id="responses">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 scroll-mt-20">
            Responses
          </h2>
          <p className="text-text-secondary mb-6">
            All responses are JSON. The success response includes both the list
            of groups and the icons with their inline SVG content.
          </p>

          <div className="space-y-6">
            {iconsApiData.responseFormats.map((format) => (
              <div key={format.label}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-text-primary text-sm">
                    {format.label}
                  </h3>
                  <Badge variant="default">{format.contentType}</Badge>
                </div>
                <CodeBlockWithCopy code={format.example} language="json" />
              </div>
            ))}
          </div>

          <div className="mt-6 border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-surface/50 border-b border-border">
              <h3 className="font-medium text-text-primary text-sm">
                Response Fields
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface/30 border-b border-border">
                  <th className="text-left px-4 py-2 font-medium text-text-secondary">
                    Field
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-text-secondary">
                    Type
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-text-secondary">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-mono text-xs text-accent">
                    groups
                  </td>
                  <td className="px-4 py-2 text-text-muted">string[]</td>
                  <td className="px-4 py-2 text-text-muted">
                    Sorted list of all unique group names
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-mono text-xs text-accent">
                    icons[].name
                  </td>
                  <td className="px-4 py-2 text-text-muted">string</td>
                  <td className="px-4 py-2 text-text-muted">
                    Icon name (kebab-case)
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-mono text-xs text-accent">
                    icons[].group
                  </td>
                  <td className="px-4 py-2 text-text-muted">string</td>
                  <td className="px-4 py-2 text-text-muted">
                    Group this icon belongs to
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs text-accent">
                    icons[].svg
                  </td>
                  <td className="px-4 py-2 text-text-muted">string</td>
                  <td className="px-4 py-2 text-text-muted">
                    Raw SVG markup (uses <code>fill=&quot;currentColor&quot;</code>{" "}
                    for theming)
                  </td>
                </tr>
              </tbody>
            </table>
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
                {iconsApiData.curlExamples.map((example) => (
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
                filename="Fetch and render icons"
              />
            </div>
          </div>

          <div className="mt-6">
            <Callout variant="note" title="SVG Theming">
              <p>
                Icons use <code>fill=&quot;currentColor&quot;</code> so they
                automatically inherit the text color of their parent element.
                Set the parent&apos;s color to control the icon color.
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
            Test the Icons API directly from your browser. Requests are proxied
            through the server so no API key is needed here.
          </p>

          <ApiPlayground
            apiName="icons"
            parameters={iconsApiData.parameters}
            endpoint={iconsApiData.endpoint}
          />
        </section>

        {/* Prev/Next */}
        <nav className="flex items-center justify-between pt-8 border-t border-border">
          <a
            href="/docs/api/css"
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
              <div className="font-medium">CSS API</div>
            </div>
          </a>
          <a
            href="/docs/api/button-styles"
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-right"
          >
            <div>
              <div className="text-xs text-text-muted">Next</div>
              <div className="font-medium">Button Styles API</div>
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
        prevPage={{ label: "CSS API", href: "/docs/api/css" }}
        nextPage={{ label: "Button Styles API", href: "/docs/api/button-styles" }}
      />
    </div>
  );
}
