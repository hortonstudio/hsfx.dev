/**
 * Seed script for component_docs table
 * Run with: npx tsx scripts/seed-component-docs.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const buttonMainData = {
  id: "button-main",
  name: "Button Main",
  slug: "button-main",
  group: "Button",
  description:
    "The primary button component used for calls-to-action and user interactions. Supports multiple style variants, sizes, and states.",
  tree: [
    {
      id: "button_wrap",
      label: "button_wrap",
      type: "component",
      children: [
        {
          id: "button_background",
          label: "button_background",
          type: "element",
        },
        {
          id: "button_label",
          label: "button_label",
          type: "element",
        },
        {
          id: "button_icon",
          label: "button_icon",
          type: "slot",
          children: [
            {
              id: "icon_svg",
              label: "Icon SVG",
              type: "element",
            },
          ],
        },
      ],
    },
  ],
  properties: [
    {
      id: "layout",
      label: "Layout",
      fields: [
        {
          id: "display",
          label: "Display",
          type: "select",
          value: "Flex",
          options: [
            { label: "Block", value: "Block" },
            { label: "Flex", value: "Flex" },
            { label: "Grid", value: "Grid" },
            { label: "Inline", value: "Inline" },
            { label: "None", value: "None" },
          ],
        },
        {
          id: "direction",
          label: "Direction",
          type: "select",
          value: "Row",
          options: [
            { label: "Row", value: "Row" },
            { label: "Column", value: "Column" },
            { label: "Row Reverse", value: "Row Reverse" },
            { label: "Column Reverse", value: "Column Reverse" },
          ],
        },
        {
          id: "align",
          label: "Align",
          type: "select",
          value: "Center",
          options: [
            { label: "Start", value: "Start" },
            { label: "Center", value: "Center" },
            { label: "End", value: "End" },
            { label: "Stretch", value: "Stretch" },
          ],
        },
        {
          id: "justify",
          label: "Justify",
          type: "select",
          value: "Center",
          options: [
            { label: "Start", value: "Start" },
            { label: "Center", value: "Center" },
            { label: "End", value: "End" },
            { label: "Space Between", value: "Space Between" },
          ],
        },
        { id: "gap", label: "Gap", type: "text", value: "8px" },
      ],
    },
    {
      id: "size",
      label: "Size",
      fields: [
        { id: "width", label: "Width", type: "text", value: "auto" },
        { id: "height", label: "Height", type: "text", value: "44px" },
        { id: "min-width", label: "Min Width", type: "text", value: "120px" },
      ],
    },
    {
      id: "spacing",
      label: "Spacing",
      fields: [
        { id: "padding", label: "Padding", type: "text", value: "12px 24px" },
        { id: "margin", label: "Margin", type: "text", value: "0" },
      ],
    },
    {
      id: "typography",
      label: "Typography",
      fields: [
        { id: "font", label: "Font", type: "text", value: "Inter" },
        {
          id: "weight",
          label: "Weight",
          type: "select",
          value: "600",
          options: [
            { label: "400", value: "400" },
            { label: "500", value: "500" },
            { label: "600", value: "600" },
            { label: "700", value: "700" },
          ],
        },
        { id: "font-size", label: "Size", type: "text", value: "14px" },
        { id: "line-height", label: "Line Height", type: "text", value: "1.4" },
      ],
    },
    {
      id: "appearance",
      label: "Appearance",
      fields: [
        { id: "background", label: "Background", type: "text", value: "#3b82f6" },
        { id: "border-radius", label: "Border Radius", type: "text", value: "8px" },
        { id: "border", label: "Border", type: "text", value: "none" },
        {
          id: "shadow",
          label: "Shadow",
          type: "text",
          value: "0 2px 4px rgba(0,0,0,0.1)",
        },
      ],
    },
    {
      id: "states",
      label: "States",
      fields: [
        { id: "hover-scale", label: "Hover Scale", type: "text", value: "1.02" },
        { id: "active-scale", label: "Active Scale", type: "text", value: "0.98" },
        {
          id: "disabled-opacity",
          label: "Disabled Opacity",
          type: "text",
          value: "0.5",
        },
      ],
    },
  ],
  css: `.button_wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  min-width: 120px;
  height: 44px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.button_wrap.is-primary {
  background: var(--button-bg, #3b82f6);
  color: var(--button-text, #ffffff);
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button_wrap.is-secondary {
  background: transparent;
  color: var(--button-text, #3b82f6);
  border: 2px solid var(--button-border, #3b82f6);
}

.button_wrap.is-text {
  background: transparent;
  color: var(--button-text, #3b82f6);
  border: none;
  padding: 8px 16px;
}

.button_wrap:hover {
  transform: scale(1.02);
}

.button_wrap:active {
  transform: scale(0.98);
}

.button_wrap:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.button_background {
  position: absolute;
  inset: 0;
  background: inherit;
  z-index: 0;
}

.button_label {
  position: relative;
  z-index: 1;
}

.button_icon {
  position: relative;
  z-index: 1;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}`,
  tokens: [
    {
      name: "button-bg",
      type: "color",
      defaultValue: "#3b82f6",
      variants: {
        Secondary: "transparent",
        Text: "transparent",
        Ghost: "transparent",
        Outline: "transparent",
        "Theme/Dark": "#60a5fa",
      },
    },
    {
      name: "button-text",
      type: "color",
      defaultValue: "#ffffff",
      variants: {
        Secondary: "#3b82f6",
        Text: "#3b82f6",
        Ghost: "#6b7280",
        Outline: "#3b82f6",
        "Theme/Dark": "#ffffff",
      },
    },
    {
      name: "button-border",
      type: "color",
      defaultValue: "transparent",
      variants: {
        Secondary: "#3b82f6",
        Outline: "#d1d5db",
        "Theme/Dark": "#60a5fa",
      },
    },
    {
      name: "button-radius",
      type: "length",
      defaultValue: "8px",
      variants: {
        Pill: "9999px",
        Square: "0px",
      },
    },
    {
      name: "button-padding-x",
      type: "length",
      defaultValue: "24px",
      variants: {
        "Size/Small": "16px",
        "Size/Large": "32px",
      },
    },
    {
      name: "button-padding-y",
      type: "length",
      defaultValue: "12px",
      variants: {
        "Size/Small": "8px",
        "Size/Large": "16px",
      },
    },
    {
      name: "button-font-size",
      type: "length",
      defaultValue: "14px",
      variants: {
        "Size/Small": "12px",
        "Size/Large": "16px",
      },
    },
    {
      name: "button-shadow",
      type: "raw",
      defaultValue: "0 2px 4px rgba(0, 0, 0, 0.1)",
      variants: {
        Secondary: "none",
        Text: "none",
        Elevated: "0 4px 12px rgba(0, 0, 0, 0.15)",
      },
    },
  ],
  contains: ["button_background", "button_label", "button_icon"],
  used_by: ["Card", "Modal", "Form", "Hero Section", "Navigation"],
  variants: {
    style: [
      { label: "Primary", value: "primary" },
      { label: "Secondary", value: "secondary" },
      { label: "Text", value: "text" },
      { label: "Ghost", value: "ghost" },
      { label: "Outline", value: "outline" },
    ],
    size: [
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
    ],
  },
  render_raw: null,
  css_raw: null,
  breakpoints: null,
  embeds: {
    usageNotes: `
<h3>When to Use</h3>
<p>Use Button Main for primary actions, form submissions, and key user interactions. Choose the appropriate variant based on the action's importance:</p>
<ul>
  <li><strong>Primary</strong> - Main call-to-action, one per section</li>
  <li><strong>Secondary</strong> - Secondary actions alongside primary</li>
  <li><strong>Text</strong> - Tertiary actions, often in navigation</li>
  <li><strong>Ghost</strong> - Subtle actions within content</li>
  <li><strong>Outline</strong> - Alternative to secondary with less emphasis</li>
</ul>

<h3>Accessibility</h3>
<p>The button component includes built-in accessibility features:</p>
<ul>
  <li>Proper focus states with visible outline</li>
  <li>Keyboard navigation support (Enter/Space to activate)</li>
  <li>ARIA attributes for disabled and loading states</li>
  <li>Sufficient color contrast for all variants</li>
</ul>

<h3>Integration with JS Frameworks</h3>
<p>When using with React, Vue, or other frameworks, you can control the button state through data attributes:</p>
<pre><code>&lt;button class="button_wrap is-primary" data-loading="true"&gt;
  Submit
&lt;/button&gt;</code></pre>

<h3>Responsive Behavior</h3>
<p>Buttons automatically adjust padding on smaller screens. Use the <code>data-full-width</code> attribute for mobile-first layouts where buttons should span the full width on small screens.</p>
`,
    propertyMappings: [
      {
        propertyName: "Disabled",
        mapsTo: "disabled attribute",
        effect: "Adds disabled state styling and prevents interaction",
      },
      {
        propertyName: "Loading",
        mapsTo: "data-loading",
        effect: "Shows loading spinner and disables button",
      },
      {
        propertyName: "Icon Position",
        mapsTo: "data-icon-position",
        effect: "Controls icon placement (left, right, only)",
      },
      {
        propertyName: "Full Width",
        mapsTo: "data-full-width",
        effect: "Makes button span full container width",
      },
      {
        propertyName: "Style Variant",
        mapsTo: ".is-{variant} combo class",
        effect: "Applies primary, secondary, text, ghost, or outline styling",
      },
    ],
  },
};

async function seed() {
  console.log("Seeding component_docs table...");

  const { data, error } = await supabase
    .from("component_docs")
    .upsert(buttonMainData, { onConflict: "slug" })
    .select();

  if (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }

  console.log("Successfully seeded Button Main component:", data);
}

seed();
