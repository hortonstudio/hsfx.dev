"use client";

import {
  Breadcrumb,
  Callout,
  CodeEditor,
  RichTextBlock,
} from "@/components/ui";

const breadcrumbItems = [
  { label: "Docs", href: "/docs" },
  { label: "Getting Started" },
];

const tableOfContents = [
  { id: "introduction", label: "Introduction" },
  { id: "setting-up", label: "Setting up your project" },
  { id: "first-page", label: "Building your first page" },
  { id: "components", label: "Working with components" },
  { id: "next-steps", label: "Next steps" },
];

const introContent = `
<p>Welcome to the HSFX component framework documentation. This guide will walk you through setting up your first Webflow project using our component-driven approach.</p>
<p>HSFX provides a comprehensive set of pre-built components that follow best practices for accessibility, responsive design, and maintainable code structure.</p>
`;

const attributeSetupCode = `<!-- Add data attributes to control component behavior -->
<div class="button_wrap is-primary"
     data-loading="false"
     data-icon-position="right"
     data-full-width="false">
  <div class="button_background"></div>
  <span class="button_label">Get Started</span>
  <div class="button_icon">
    <svg>...</svg>
  </div>
</div>

<!-- For React/Vue integration -->
<script>
  // Toggle loading state
  document.querySelector('.button_wrap')
    .setAttribute('data-loading', 'true');
</script>`;

const importCode = `/* Import HSFX base styles */
@import 'hsfx/base.css';
@import 'hsfx/components/button.css';
@import 'hsfx/components/section.css';
@import 'hsfx/utilities.css';

/* Or import everything */
@import 'hsfx/all.css';`;

export default function GettingStartedPage() {
  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Title */}
      <div>
        <h1 className="font-serif text-4xl font-bold text-text-primary mb-4">
          Building Your First Page
        </h1>
        <p className="text-lg text-text-secondary max-w-3xl">
          Learn how to set up a Webflow project with HSFX components and build your first page using our component-driven workflow.
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="border border-border rounded-lg p-6">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          On this page
        </h2>
        <ul className="space-y-2">
          {tableOfContents.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-text-secondary hover:text-accent transition-colors"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Introduction */}
      <section id="introduction">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Introduction</h2>
        <RichTextBlock html={introContent} />
      </section>

      {/* Setting Up */}
      <section id="setting-up">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Setting up your project</h2>

        <RichTextBlock html={`
          <p>Before you begin, make sure you have access to a Webflow project. HSFX works with any Webflow plan, including the free tier for prototyping.</p>
          <h3>Step 1: Import the component library</h3>
          <p>Add the HSFX stylesheet to your project's custom code section. This gives you access to all component styles and design tokens.</p>
        `} />

        <div className="my-6">
          <CodeEditor
            value={importCode}
            language="css"
            readOnly
            height="180px"
          />
        </div>

        <Callout variant="tip" title="Pro Tip">
          <p>Import only the components you need to keep your CSS bundle size small. Each component is independently importable.</p>
        </Callout>
      </section>

      {/* Building First Page */}
      <section id="first-page">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Building your first page</h2>

        <RichTextBlock html={`
          <p>Let's create a simple landing page section using HSFX components. We'll use the Section, Container, and Button components.</p>
          <h3>Creating the structure</h3>
          <p>In Webflow, create a new div and apply the <code>section_wrap</code> class. Inside, add a <code>container_wrap</code> for content alignment, then add your heading, paragraph, and button components.</p>
        `} />

        <Callout variant="warning" title="Browser Support">
          <p>HSFX uses modern CSS features like <code>color-mix()</code> and CSS custom properties. Ensure your target browsers support these features, or include the provided polyfills for older browser support.</p>
        </Callout>
      </section>

      {/* Working with Components */}
      <section id="components">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Working with components</h2>

        <RichTextBlock html={`
          <p>HSFX components are controlled through a combination of CSS classes and data attributes. Classes define the base styling and variants, while data attributes control interactive behavior.</p>
        `} />

        <div className="my-6">
          <CodeEditor
            value={attributeSetupCode}
            language="html"
            readOnly
            height="300px"
          />
        </div>

        <Callout variant="note" title="Note">
          <p>Data attributes are optional. Components work with just CSS classes. Add attributes only when you need JavaScript-controlled state changes.</p>
        </Callout>

        <div className="mt-6">
          <RichTextBlock html={`
            <h3>Component variants</h3>
            <p>Most components support multiple variants through combo classes. For example, the Button component supports:</p>
            <ul>
              <li><code>.is-primary</code> - Primary action button</li>
              <li><code>.is-secondary</code> - Secondary action button</li>
              <li><code>.is-text</code> - Text-only button style</li>
              <li><code>.is-ghost</code> - Subtle ghost button</li>
              <li><code>.is-outline</code> - Outlined button style</li>
            </ul>
            <p>See the <a href="/docs/components/button-main">Button Main documentation</a> for complete variant details and design tokens.</p>
          `} />
        </div>
      </section>

      {/* Next Steps */}
      <section id="next-steps">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Next steps</h2>

        <RichTextBlock html={`
          <p>Now that you've set up your first page, explore more components and patterns:</p>
          <ul>
            <li><a href="/docs/components/button-main">Button Main</a> - Learn about button variants and states</li>
            <li><a href="/docs/components/section">Section</a> - Page layout sections with spacing</li>
            <li><a href="/docs/components/grid">Grid</a> - Responsive grid layouts</li>
          </ul>
          <p>For questions and support, join our community Discord or check the FAQ section.</p>
        `} />

        <Callout variant="success" title="Ready to build?">
          <p>You now have everything you need to start building with HSFX. Browse the component library to see all available components and their documentation.</p>
        </Callout>
      </section>

      {/* Prev/Next Navigation */}
      <nav className="flex items-center justify-between pt-8 border-t border-border">
        <a
          href="/docs/installation"
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
            <div className="font-medium">Installation</div>
          </div>
        </a>
        <a
          href="/docs/components/button-main"
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-right"
        >
          <div>
            <div className="text-xs text-text-muted">Next</div>
            <div className="font-medium">Button Main</div>
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
  );
}
