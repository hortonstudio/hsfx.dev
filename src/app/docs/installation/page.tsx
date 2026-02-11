"use client";

import {
  Breadcrumb,
  Callout,
  CodeEditor,
  RichTextBlock,
  Steps,
  Step,
} from "@/components/ui";

const breadcrumbItems = [
  { label: "Docs", href: "/docs" },
  { label: "Getting Started", href: "/docs/getting-started" },
  { label: "Installation" },
];

const npmInstallCode = `# Using npm
npm install @hsfx/components

# Using yarn
yarn add @hsfx/components

# Using pnpm
pnpm add @hsfx/components`;

const webflowSetupCode = `<!-- Add to your Webflow project's custom code (Site Settings > Custom Code > Head) -->
<link rel="stylesheet" href="https://cdn.hsfx.dev/v1/hsfx.min.css">

<!-- Or for development with source maps -->
<link rel="stylesheet" href="https://cdn.hsfx.dev/v1/hsfx.css">`;

const tailwindConfigCode = `// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@hsfx/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // HSFX design tokens are automatically included
      },
    },
  },
  plugins: [
    require('@hsfx/tailwind-plugin'),
  ],
}`;

const cssImportCode = `/* Import in your main CSS file */
@import '@hsfx/components/styles/base.css';
@import '@hsfx/components/styles/components.css';
@import '@hsfx/components/styles/utilities.css';

/* Or import everything at once */
@import '@hsfx/components/styles/index.css';`;

export default function InstallationPage() {
  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Title */}
      <div>
        <h1 className="font-serif text-4xl font-bold text-text-primary mb-4">
          Installation
        </h1>
        <p className="text-lg text-text-secondary max-w-3xl">
          Get started with HSFX components in your project. Choose the installation method that best fits your workflow.
        </p>
      </div>

      {/* Prerequisites */}
      <section id="prerequisites">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Prerequisites</h2>
        <RichTextBlock html={`
          <p>Before installing HSFX, ensure you have:</p>
          <ul>
            <li><strong>Node.js 18+</strong> for npm/React projects</li>
            <li><strong>A Webflow account</strong> for Webflow integration</li>
            <li><strong>Modern browser</strong> with CSS custom properties support</li>
          </ul>
        `} />
      </section>

      {/* Webflow Installation */}
      <section id="webflow">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Webflow Installation</h2>

        <RichTextBlock html={`
          <p>For Webflow projects, add the HSFX stylesheet to your project's custom code section.</p>
        `} />

        <Steps className="my-6">
          <Step title="Open Site Settings">
            Navigate to your Webflow project, then go to <strong>Site Settings → Custom Code</strong>.
          </Step>
          <Step title="Add Stylesheet">
            In the <strong>Head Code</strong> section, paste the stylesheet link.
          </Step>
          <Step title="Publish">
            Save and publish your site to apply the styles.
          </Step>
        </Steps>

        <div className="my-6">
          <CodeEditor
            value={webflowSetupCode}
            language="html"
            readOnly
            height="150px"
          />
        </div>

        <Callout variant="tip" title="CDN Benefits">
          <p>The CDN-hosted version includes automatic updates for patch releases and is optimized for performance with gzip compression and global edge caching.</p>
        </Callout>
      </section>

      {/* NPM Installation */}
      <section id="npm">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">NPM Installation</h2>

        <RichTextBlock html={`
          <p>For React, Next.js, or other Node.js-based projects, install via npm.</p>
        `} />

        <div className="my-6">
          <CodeEditor
            value={npmInstallCode}
            language="javascript"
            readOnly
            height="150px"
          />
        </div>

        <h3 className="font-serif text-xl font-bold text-text-primary mb-4 mt-8">Import Styles</h3>

        <RichTextBlock html={`
          <p>After installing, import the CSS in your application's entry point or global stylesheet.</p>
        `} />

        <div className="my-6">
          <CodeEditor
            value={cssImportCode}
            language="css"
            readOnly
            height="180px"
          />
        </div>
      </section>

      {/* Tailwind Integration */}
      <section id="tailwind">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Tailwind CSS Integration</h2>

        <RichTextBlock html={`
          <p>If you're using Tailwind CSS, HSFX provides a plugin that adds all design tokens as Tailwind utilities.</p>
        `} />

        <div className="my-6">
          <CodeEditor
            value={tailwindConfigCode}
            language="javascript"
            readOnly
            height="280px"
          />
        </div>

        <Callout variant="note" title="Design Token Sync">
          <p>The Tailwind plugin automatically syncs HSFX design tokens with your Tailwind theme, giving you access to colors, spacing, and typography scales via utility classes.</p>
        </Callout>
      </section>

      {/* Verification */}
      <section id="verification">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Verify Installation</h2>

        <RichTextBlock html={`
          <p>To verify HSFX is installed correctly, check that:</p>
          <ol>
            <li>CSS custom properties are available (inspect any element and look for <code>--hsfx-*</code> variables)</li>
            <li>Component classes are recognized (e.g., <code>.button_wrap</code> should have styles)</li>
            <li>No console errors related to missing stylesheets</li>
          </ol>
        `} />

        <Callout variant="success" title="Ready to Build">
          <p>Once installed, head to the <a href="/docs/getting-started" className="text-accent hover:text-accent-hover">Getting Started</a> guide to build your first page with HSFX components.</p>
        </Callout>
      </section>

      {/* Prev/Next Navigation */}
      <nav className="flex items-center justify-between pt-8 border-t border-border">
        <a
          href="/docs/getting-started"
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <div>
            <div className="text-xs text-text-muted">Previous</div>
            <div className="font-medium">Getting Started</div>
          </div>
        </a>
        <a
          href="/docs/first-page"
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-right"
        >
          <div>
            <div className="text-xs text-text-muted">Next</div>
            <div className="font-medium">Building Your First Page</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      </nav>
    </div>
  );
}
