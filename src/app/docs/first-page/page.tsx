"use client";

import {
  Breadcrumb,
  Callout,
  CodeEditor,
  RichTextBlock,
  NumberedSteps,
  NumberedStep,
} from "@/components/ui";
import { brand } from "@/config";

const breadcrumbItems = [
  { label: "Docs", href: "/docs" },
  { label: "Getting Started", href: "/docs/getting-started" },
  { label: "Building Your First Page" },
];

const sectionHtmlCode = `<section class="section_wrap">
  <div class="container_wrap">
    <div class="section_content">
      <!-- Your content goes here -->
    </div>
  </div>
</section>`;

const heroExampleCode = `<section class="section_wrap is-hero">
  <div class="container_wrap">
    <div class="hero_content">
      <h1 class="heading_wrap is-display">
        <span class="heading_text">Welcome to Your Site</span>
      </h1>

      <p class="paragraph_wrap is-large">
        Build beautiful, responsive websites with ${brand.name} components.
        Designed for Webflow and React.
      </p>

      <div class="button_group">
        <div class="button_wrap is-primary">
          <span class="button_label">Get Started</span>
          <div class="button_icon">
            <svg><!-- arrow icon --></svg>
          </div>
        </div>

        <div class="button_wrap is-secondary">
          <span class="button_label">Learn More</span>
        </div>
      </div>
    </div>
  </div>
</section>`;

const responsiveCode = `/* ${brand.name} components are responsive by default */
.section_wrap {
  padding: var(--section-padding-y) var(--section-padding-x);
}

/* Design tokens adapt to screen size */
@media (max-width: 768px) {
  :root {
    --section-padding-y: 3rem;
    --section-padding-x: 1rem;
  }
}

@media (min-width: 769px) {
  :root {
    --section-padding-y: 5rem;
    --section-padding-x: 2rem;
  }
}`;

const variantCode = `<!-- Button variants -->
<div class="button_wrap is-primary">Primary</div>
<div class="button_wrap is-secondary">Secondary</div>
<div class="button_wrap is-outline">Outline</div>
<div class="button_wrap is-ghost">Ghost</div>
<div class="button_wrap is-text">Text</div>

<!-- Section variants -->
<section class="section_wrap is-hero">Hero section</section>
<section class="section_wrap is-dark">Dark background</section>
<section class="section_wrap is-light">Light background</section>`;

export default function FirstPageGuide() {
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
          Learn how to structure a complete page using {brand.name} components. We&apos;ll build a hero section with heading, paragraph, and buttons.
        </p>
      </div>

      {/* Page Structure */}
      <section id="page-structure">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Understanding Page Structure</h2>

        <RichTextBlock html={`
          <p>${brand.name} pages follow a consistent structure:</p>
          <ul>
            <li><strong>Sections</strong> (<code>.section_wrap</code>) - Top-level page divisions with vertical spacing</li>
            <li><strong>Containers</strong> (<code>.container_wrap</code>) - Content width constraints and horizontal padding</li>
            <li><strong>Content blocks</strong> - Headings, paragraphs, buttons, and other components</li>
          </ul>
        `} />

        <div className="my-6">
          <CodeEditor
            value={sectionHtmlCode}
            language="html"
            readOnly
            height="180px"
          />
        </div>

        <Callout variant="tip" title="Naming Convention">
          <p>{brand.name} uses a consistent naming pattern: <code>component_element</code> for class names and <code>is-variant</code> for modifiers. This makes it easy to understand and extend.</p>
        </Callout>
      </section>

      {/* Step by Step */}
      <section id="step-by-step">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-6">Building a Hero Section</h2>

        <NumberedSteps>
          <NumberedStep title="Create the Section Container">
            <p className="text-text-secondary mb-4">
              Start with a <code className="text-accent">.section_wrap</code> element. Add the <code className="text-accent">.is-hero</code> variant for hero-specific styling.
            </p>
          </NumberedStep>

          <NumberedStep title="Add a Container">
            <p className="text-text-secondary mb-4">
              Inside the section, add a <code className="text-accent">.container_wrap</code> to constrain content width and add responsive padding.
            </p>
          </NumberedStep>

          <NumberedStep title="Add Your Heading">
            <p className="text-text-secondary mb-4">
              Use <code className="text-accent">.heading_wrap.is-display</code> for large hero headings. The text goes inside <code className="text-accent">.heading_text</code>.
            </p>
          </NumberedStep>

          <NumberedStep title="Add Supporting Text">
            <p className="text-text-secondary mb-4">
              Add a <code className="text-accent">.paragraph_wrap.is-large</code> for the hero description. This provides larger, more readable text.
            </p>
          </NumberedStep>

          <NumberedStep title="Add Call-to-Action Buttons">
            <p className="text-text-secondary mb-4">
              Wrap buttons in a <code className="text-accent">.button_group</code> for proper spacing. Use <code className="text-accent">.is-primary</code> for the main CTA.
            </p>
          </NumberedStep>
        </NumberedSteps>
      </section>

      {/* Complete Example */}
      <section id="complete-example">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Complete Hero Example</h2>

        <RichTextBlock html={`
          <p>Here's the complete HTML for a hero section with all elements combined:</p>
        `} />

        <div className="my-6">
          <CodeEditor
            value={heroExampleCode}
            language="html"
            readOnly
            height="450px"
          />
        </div>
      </section>

      {/* Variants */}
      <section id="variants">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Using Variants</h2>

        <RichTextBlock html={`
          <p>Most ${brand.name} components support multiple visual variants. Add variant classes alongside the base class to change appearance:</p>
        `} />

        <div className="my-6">
          <CodeEditor
            value={variantCode}
            language="html"
            readOnly
            height="280px"
          />
        </div>

        <Callout variant="note" title="Variant Documentation">
          <p>Each component&apos;s documentation page lists all available variants with live previews. See the <a href="/docs/components/button-main" className="text-accent hover:text-accent-hover">Button documentation</a> for a complete example.</p>
        </Callout>
      </section>

      {/* Responsive Design */}
      <section id="responsive">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Responsive Design</h2>

        <RichTextBlock html={`
          <p>${brand.name} components are responsive by default. Design tokens automatically adjust based on screen size, so you don't need to write media queries for basic responsiveness.</p>
        `} />

        <div className="my-6">
          <CodeEditor
            value={responsiveCode}
            language="css"
            readOnly
            height="280px"
          />
        </div>

        <Callout variant="success" title="Mobile-First">
          <p>All components are designed mobile-first and scale up gracefully. Test your pages at different breakpoints to ensure they look great on all devices.</p>
        </Callout>
      </section>

      {/* Next Steps */}
      <section id="next-steps">
        <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Next Steps</h2>

        <RichTextBlock html={`
          <p>Now that you've built your first page, explore these resources:</p>
          <ul>
            <li><a href="/docs/components/button-main">Button Components</a> - All button variants and properties</li>
            <li><a href="/docs/components/section">Section Layouts</a> - Page section patterns</li>
            <li><a href="/docs/components/heading">Typography</a> - Heading and text styles</li>
          </ul>
        `} />
      </section>

      {/* Prev/Next Navigation */}
      <nav className="flex items-center justify-between pt-8 border-t border-border">
        <a
          href="/docs/installation"
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      </nav>
    </div>
  );
}
