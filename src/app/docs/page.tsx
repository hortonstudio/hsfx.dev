"use client";

import Link from "next/link";
import { Breadcrumb } from "@/components/ui";
import { messages } from "@/config";

const breadcrumbItems = [{ label: "Docs" }];

const sections = [
  {
    title: "Getting Started",
    description: messages.docs.index.gettingStartedDesc,
    links: [
      { label: "Introduction", href: "/docs/getting-started", description: "Overview and core concepts" },
      { label: "Installation", href: "/docs/installation", description: messages.docs.index.installationDesc },
      { label: "First Page", href: "/docs/first-page", description: "Build your first page" },
    ],
  },
  {
    title: "Components",
    description: messages.docs.index.componentsDesc,
    links: [
      { label: "Browse All", href: "/docs/components", description: "View all available components" },
      { label: "Button", href: "/docs/components/button-main", description: "Button variants and states" },
      { label: "Section", href: "/docs/components/section", description: "Page layout sections" },
    ],
  },
  {
    title: "API Reference",
    description: "Guides, playgrounds, and downloadable docs for HSFX APIs",
    links: [
      { label: "API Overview", href: "/docs/api", description: "Authentication, rate limits, and getting started" },
      { label: "CSS API", href: "/docs/api/css", description: "Fetch CSS entries with minification options" },
      { label: "Icons API", href: "/docs/api/icons", description: "Retrieve SVG icons organized by group" },
    ],
  },
  {
    title: "Tools",
    description: "Developer tools and utilities",
    links: [
      { label: "Doc Generator", href: "/tools/doc-generator", description: "Generate component documentation" },
    ],
  },
];

export default function DocsIndexPage() {
  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Title */}
      <div>
        <h1 className="font-serif text-4xl font-bold text-text-primary mb-4">
          Documentation
        </h1>
        <p className="text-lg text-text-secondary max-w-3xl">
          {messages.docs.index.description}
        </p>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-text-primary mb-1">
                {section.title}
              </h2>
              <p className="text-sm text-text-muted">
                {section.description}
              </p>
            </div>

            <div className="space-y-2">
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block p-3 border border-border rounded-lg hover:border-accent/50 hover:bg-surface/50 transition-all group"
                >
                  <div className="font-medium text-text-primary group-hover:text-accent transition-colors">
                    {link.label}
                  </div>
                  <div className="text-sm text-text-muted">
                    {link.description}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="pt-8 border-t border-border">
        <h2 className="font-serif text-xl font-bold text-text-primary mb-4">
          Quick Links
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/docs/getting-started"
            className="px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors text-sm font-medium"
          >
            Get Started
          </Link>
          <Link
            href="/docs/components"
            className="px-4 py-2 bg-surface border border-border rounded-lg hover:border-accent/50 transition-colors text-sm font-medium text-text-primary"
          >
            Browse Components
          </Link>
          <Link
            href="/docs/api"
            className="px-4 py-2 bg-surface border border-border rounded-lg hover:border-accent/50 transition-colors text-sm font-medium text-text-primary"
          >
            API Docs
          </Link>
          <Link
            href="/tools/doc-generator"
            className="px-4 py-2 bg-surface border border-border rounded-lg hover:border-accent/50 transition-colors text-sm font-medium text-text-primary"
          >
            Generate Docs
          </Link>
        </div>
      </div>
    </div>
  );
}
