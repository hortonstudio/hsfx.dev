import { brand } from "./brand";

/**
 * UI Messages / Copy
 *
 * All user-facing strings organized by page/section.
 * Uses brand config for interpolation so strings auto-update on rebrand.
 */
export const messages = {
  metadata: {
    title: `${brand.name} - ${brand.tagline}`,
  },

  navbar: {
    logoAlt: brand.name,
  },

  features: {
    devToolkit: `${brand.name} Kit runs inside the Webflow Designer. CSS framework tools, button animators, snippet managers, and visual builders.`,
  },

  performance: {
    description: `Every byte counts. ${brand.name} is engineered for performance from the ground up, ensuring your sites load fast and run smooth.`,
  },

  howItWorks: {
    step1: `Drag pre-built ${brand.name} components directly into your Webflow project. Each comes with configurable properties and responsive behavior.`,
    scriptInit: `${brand.dataPrefix}.init()`,
  },

  interactiveDemo: {
    slider: `data-${brand.dataPrefix}-slider`,
    grid: `data-${brand.dataPrefix}-grid`,
    schema: `data-${brand.dataPrefix}-schema`,
    entrance: `data-${brand.dataPrefix}-entrance`,
  },

  docs: {
    index: {
      description: `Everything you need to build with ${brand.name} components. From getting started guides to detailed component API references.`,
      gettingStartedDesc: `Learn the basics of ${brand.name} and set up your first project`,
      installationDesc: `Set up ${brand.name} in your project`,
      componentsDesc: `Detailed documentation for all ${brand.name} components`,
    },

    gettingStarted: {
      subtitle: `Learn how to set up a Webflow project with ${brand.name} components and build your first page using our component-driven workflow.`,
      introP1: `<p>Welcome to the ${brand.name} component framework documentation. This guide will walk you through setting up your first Webflow project using our component-driven approach.</p>`,
      introP2: `<p>${brand.name} provides a comprehensive set of pre-built components that follow best practices for accessibility, responsive design, and maintainable code structure.</p>`,
      prerequisite: `<p>Before you begin, make sure you have access to a Webflow project. ${brand.name} works with any Webflow plan, including the free tier for prototyping.</p>`,
      importStep: `<p>Add the ${brand.name} stylesheet to your project's custom code section. This gives you access to all component styles and design tokens.</p>`,
      firstSection: `<p>Let's create a simple landing page section using ${brand.name} components. We'll use the Section, Container, and Button components.</p>`,
      browserSupport: `<p>${brand.name} uses modern CSS features like <code>color-mix()</code> and CSS custom properties. Ensure your target browsers support these features, or include the provided polyfills for older browser support.</p>`,
      componentIntro: `<p>${brand.name} components are controlled through a combination of CSS classes and data attributes. Classes define the base styling and variants, while data attributes control interactive behavior.</p>`,
      readyToBuild: `<p>You now have everything you need to start building with ${brand.name}. Browse the component library to see all available components and their documentation.</p>`,
      cssImportBase: `@import '${brand.npmScope}/base.css';`,
      cssImportButton: `@import '${brand.npmScope}/components/button.css';`,
      cssImportSection: `@import '${brand.npmScope}/components/section.css';`,
      cssImportUtilities: `@import '${brand.npmScope}/utilities.css';`,
      cssImportAll: `@import '${brand.npmScope}/all.css';`,
    },

    installation: {
      subtitle: `Get started with ${brand.name} components in your project. Choose the installation method that best fits your workflow.`,
      prerequisitesIntro: `<p>Before installing ${brand.name}, ensure you have:</p>`,
      webflowIntro: `<p>For Webflow projects, add the ${brand.name} stylesheet to your project's custom code section.</p>`,
      tailwindIntro: `<p>If you're using Tailwind CSS, ${brand.name} provides a plugin that adds all design tokens as Tailwind utilities.</p>`,
      tailwindSync: `<p>The Tailwind plugin automatically syncs ${brand.name} design tokens with your Tailwind theme, giving you access to colors, spacing, and typography scales via utility classes.</p>`,
      verifyIntro: `<p>To verify ${brand.name} is installed correctly, check that:</p>`,
      verifyCssVars: `CSS custom properties are available (inspect any element and look for <code>--${brand.cssPrefix}-*</code> variables)`,
      readyToBuild: `<p>Once installed, head to the <a href="/docs/getting-started" className="text-accent hover:text-accent-hover">Getting Started</a> guide to build your first page with ${brand.name} components.</p>`,
      npmInstallCode: `# Using npm\nnpm install @${brand.npmScope}/components\n\n# Using yarn\nyarn add @${brand.npmScope}/components\n\n# Using pnpm\npnpm add @${brand.npmScope}/components`,
      webflowSetupCode: `<!-- Add to your site's <head> section -->\n<link rel="stylesheet" href="${brand.cdnUrl}/v1/${brand.npmScope}.min.css">\n\n<!-- Or use the unminified version for development -->\n<link rel="stylesheet" href="${brand.cdnUrl}/v1/${brand.npmScope}.css">`,
      tailwindConfigCode: `// tailwind.config.js\nmodule.exports = {\n  content: [\n    './src/**/*.{js,ts,jsx,tsx}',\n    './node_modules/@${brand.npmScope}/components/**/*.{js,ts,jsx,tsx}',\n  ],\n  theme: {\n    extend: {\n      colors: {\n        // ${brand.name} design tokens are automatically included\n      },\n    },\n  },\n  plugins: [\n    require('@${brand.npmScope}/tailwind-plugin'),\n  ],\n}`,
      cssImportCode: `/* Import in your main CSS file */\n@import '@${brand.npmScope}/components/styles/base.css';\n@import '@${brand.npmScope}/components/styles/components.css';\n@import '@${brand.npmScope}/components/styles/utilities.css';\n\n/* Or import everything at once */\n@import '@${brand.npmScope}/components/styles/index.css';`,
    },

    firstPage: {
      subtitle: `Build beautiful, responsive websites with ${brand.name} components. Designed for Webflow and React.`,
      pageDescription: `Learn how to structure a complete page using ${brand.name} components. We'll build a hero section with heading, paragraph, and buttons.`,
      pageStructure: `<p>${brand.name} pages follow a consistent structure:</p>`,
      namingConvention: `<p>${brand.name} uses a consistent naming pattern: <code>component_element</code> for class names and <code>is-variant</code> for modifiers. This makes it easy to understand and extend.</p>`,
      variants: `<p>Most ${brand.name} components support multiple visual variants. Add variant classes alongside the base class to change appearance:</p>`,
      responsive: `<p>${brand.name} components are responsive by default. Design tokens automatically adjust based on screen size, so you don't need to write media queries for basic responsiveness.</p>`,
    },

    components: {
      subtitle: `Browse all available ${brand.name} components. Each component includes structure documentation, CSS, design tokens, and usage notes.`,
      aiSummaryFilename: `${brand.dataPrefix}-components-ai-summary.md`,
      aiSummaryHeader: `# ${brand.name} Component Library - AI Reference`,
    },

    api: {
      indexDescription: `Comprehensive guides for integrating with ${brand.name} APIs. Each API includes authentication details, parameter references, code examples, and interactive playgrounds.`,
      authDescription: `All ${brand.name} APIs require authentication via an \`x-api-key\` header. Contact us to obtain your API key.`,
      cssApiDescription: `The CSS API serves CSS entries from the ${brand.name} design system. Fetch individual entries, combine group CSS, and control minification.`,
      iconsApiDescription: `The Icons API provides access to the ${brand.name} SVG icon library. Query icons by group and receive structured JSON responses.`,
    },
  },

  styleguide: {
    description: `A comprehensive reference for the ${brand.name} design system. All components support light and dark themes.`,
    footer: `${brand.name} Design System`,
    installCmd: `npm install @${brand.npmScope}/ui`,
    importExample: `import { Button, Card } from '@${brand.npmScope}/ui';`,
  },

  auth: {
    contactHref: `mailto:${brand.email}`,
  },
} as const;
