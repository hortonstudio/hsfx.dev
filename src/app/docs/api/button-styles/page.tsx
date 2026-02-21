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
import { buttonStylesApiData } from "@/lib/docs/apiData";
import { generateApiMarkdown } from "@/lib/docs/generateApiMarkdown";

const breadcrumbItems = [
  { label: "Docs", href: "/docs" },
  { label: "API Reference", href: "/docs/api" },
  { label: "Button Styles API" },
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
  "https://${brand.domain}/api/button-styles",
  {
    headers: {
      "x-api-key": process.env.BUTTON_STYLES_API_KEY,
    },
  }
);

const data = await response.json();

// Access button main animations
const { buttonMain, accessories, footerLink } = data;

// Get the default animation for primary buttons
const defaultAnim = buttonMain.config.defaultAnimations.primary;
const css = buttonMain.animations[defaultAnim].css;

// Inject defaults + animation CSS
const style = document.createElement("style");
style.textContent = buttonMain.defaultsCSS + "\\n" + css;
document.head.appendChild(style);`;

export default function ButtonStylesApiDocPage() {
  const activeSection = useActiveSection(sectionIds);
  const { setCurrentSection } = useDocSection();

  useEffect(() => {
    setCurrentSection(activeSection);
  }, [activeSection, setCurrentSection]);

  const handleDownloadMd = () => {
    const md = generateApiMarkdown(buttonStylesApiData);
    downloadTextFile(`${brand.dataPrefix}-button-styles-api.md`, md);
  };

  const handleCopyMd = () => {
    const md = generateApiMarkdown(buttonStylesApiData);
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
            <code className="text-sm text-text-muted">{buttonStylesApiData.endpoint}</code>
          </div>
          <h1 className="font-serif text-4xl font-bold text-text-primary mb-4">
            Button Styles API
          </h1>
          <p className="text-lg text-text-secondary max-w-3xl">
            {buttonStylesApiData.description}
          </p>
        </div>

        {/* Overview */}
        <section id="overview">
          <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 scroll-mt-20">
            Overview
          </h2>
          <p className="text-text-secondary mb-4">
            The Button Styles API serves button animation CSS and configuration
            data stored in Supabase. It powers the Webflow button animation app,
            providing pre-parsed JSON that maps animation types to CSS for each
            button component (main buttons, arrow, close, play, and footer links).
          </p>
          <p className="text-text-secondary">
            By default, the API returns a structured response optimized for the
            Webflow app. Use{" "}
            <code className="px-1.5 py-0.5 bg-surface border border-border rounded text-sm">
              raw=true
            </code>{" "}
            to get flat database entries for management tools or MCP server
            integration.
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

          <Callout variant="warning" title="Dedicated API Key">
            <p>
              The Button Styles API requires its own key, separate from the CSS
              and Icons API keys. Store it in an environment variable and never
              expose it in client-side code.
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
                {buttonStylesApiData.parameters.map((param) => (
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
            The default response is a pre-parsed JSON object structured for the
            Webflow button animation app. Use{" "}
            <code className="px-1.5 py-0.5 bg-surface border border-border rounded text-sm">
              raw=true
            </code>{" "}
            to get a flat array of all database entries.
          </p>

          <div className="space-y-6">
            {buttonStylesApiData.responseFormats.map((format) => (
              <div key={format.label}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-text-primary text-sm">
                    {format.label}
                  </h3>
                  <Badge variant="default">{format.contentType}</Badge>
                </div>
                <CodeBlockWithCopy
                  code={format.example}
                  language="json"
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
                {buttonStylesApiData.curlExamples.map((example) => (
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
                filename="Fetch and inject button styles"
              />
            </div>
          </div>

          <div className="mt-6">
            <Callout variant="note" title="CORS">
              <p>
                The Button Styles API allows requests from any origin (
                <code>Access-Control-Allow-Origin: *</code>). You can call it
                directly from client-side JavaScript, but keep your API key
                secure by proxying requests through your backend.
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
            Test the Button Styles API directly from your browser. Requests are
            proxied through the server so no API key is needed here.
          </p>

          <ApiPlayground
            apiName="button-styles"
            parameters={buttonStylesApiData.parameters}
            endpoint={buttonStylesApiData.endpoint}
          />
        </section>

        {/* Prev/Next */}
        <nav className="flex items-center justify-between pt-8 border-t border-border">
          <a
            href="/docs/api/icons"
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
              <div className="font-medium">Icons API</div>
            </div>
          </a>
          <a
            href="/docs/components"
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-right"
          >
            <div>
              <div className="text-xs text-text-muted">Next</div>
              <div className="font-medium">Components</div>
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
        prevPage={{ label: "Icons API", href: "/docs/api/icons" }}
        nextPage={{ label: "Components", href: "/docs/components" }}
      />
    </div>
  );
}
