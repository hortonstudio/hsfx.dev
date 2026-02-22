import type { SceneConfig } from "./types";

export interface PreviewTemplate {
  id: string;
  label: string;
  html: string;
  description: string;
}

export const PREVIEW_TEMPLATES: PreviewTemplate[] = [
  {
    id: "heading",
    label: "Heading",
    description: "Single heading text",
    html: `<div class="preview-container" style="display:flex;align-items:center;justify-content:center;height:100%;padding:2rem;">
  <h1 class="heading element" data-hs-anim="element" style="font-size:3rem;font-weight:700;color:inherit;font-family:inherit;line-height:1.1;">
    Animate This Heading
  </h1>
</div>`,
  },
  {
    id: "text-block",
    label: "Text Block",
    description: "Heading with paragraph text",
    html: `<div class="preview-container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:2rem;gap:1rem;max-width:600px;margin:0 auto;">
  <h2 class="heading element" data-hs-anim="element" style="font-size:2.5rem;font-weight:700;color:inherit;line-height:1.1;">
    Hero Heading
  </h2>
  <p class="paragraph element" data-hs-anim="element" style="font-size:1.125rem;color:inherit;opacity:0.7;line-height:1.6;text-align:center;">
    This is a paragraph of text that can be animated with split text, stagger effects, and more.
  </p>
</div>`,
  },
  {
    id: "card",
    label: "Card",
    description: "Single card element",
    html: `<div class="preview-container" style="display:flex;align-items:center;justify-content:center;height:100%;padding:2rem;">
  <div class="card element" data-hs-anim="element" style="padding:2rem;border-radius:1rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);max-width:400px;width:100%;">
    <div class="card-icon" style="width:48px;height:48px;border-radius:12px;background:rgba(14,165,233,0.1);margin-bottom:1rem;"></div>
    <h3 class="card-title" style="font-size:1.25rem;font-weight:600;color:inherit;margin-bottom:0.5rem;">Card Title</h3>
    <p class="card-text" style="font-size:0.875rem;color:inherit;opacity:0.6;line-height:1.5;">Card description text that explains something interesting about this feature.</p>
  </div>
</div>`,
  },
  {
    id: "cards-grid",
    label: "Card Grid",
    description: "Grid of cards for stagger effects",
    html: `<div class="preview-container" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;padding:2rem;height:100%;align-content:center;">
  <div class="card element" data-hs-anim="element" style="padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);">
    <div style="width:32px;height:32px;border-radius:8px;background:rgba(14,165,233,0.15);margin-bottom:0.75rem;"></div>
    <h4 style="font-size:1rem;font-weight:600;color:inherit;margin-bottom:0.25rem;">Card One</h4>
    <p style="font-size:0.8rem;color:inherit;opacity:0.5;">Description text</p>
  </div>
  <div class="card element" data-hs-anim="element" style="padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);">
    <div style="width:32px;height:32px;border-radius:8px;background:rgba(139,92,246,0.15);margin-bottom:0.75rem;"></div>
    <h4 style="font-size:1rem;font-weight:600;color:inherit;margin-bottom:0.25rem;">Card Two</h4>
    <p style="font-size:0.8rem;color:inherit;opacity:0.5;">Description text</p>
  </div>
  <div class="card element" data-hs-anim="element" style="padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);">
    <div style="width:32px;height:32px;border-radius:8px;background:rgba(245,158,11,0.15);margin-bottom:0.75rem;"></div>
    <h4 style="font-size:1rem;font-weight:600;color:inherit;margin-bottom:0.25rem;">Card Three</h4>
    <p style="font-size:0.8rem;color:inherit;opacity:0.5;">Description text</p>
  </div>
</div>`,
  },
  {
    id: "hero",
    label: "Hero Section",
    description: "Full hero with heading, text, and buttons",
    html: `<div class="preview-container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:2rem;text-align:center;gap:1.5rem;">
  <span class="badge element" data-hs-anim="element" style="display:inline-block;padding:0.25rem 0.75rem;border-radius:9999px;font-size:0.75rem;font-weight:500;background:rgba(14,165,233,0.1);color:rgba(14,165,233,1);">New Feature</span>
  <h1 class="heading element" data-hs-anim="element" style="font-size:3rem;font-weight:800;color:inherit;line-height:1.05;max-width:700px;">
    Build Something Amazing
  </h1>
  <p class="paragraph element" data-hs-anim="element" style="font-size:1.125rem;color:inherit;opacity:0.6;max-width:500px;line-height:1.6;">
    Create stunning animations with an intuitive visual timeline editor.
  </p>
  <div class="buttons element" data-hs-anim="element" style="display:flex;gap:0.75rem;margin-top:0.5rem;">
    <button style="padding:0.75rem 1.5rem;border-radius:0.5rem;background:rgba(14,165,233,1);color:white;font-weight:500;font-size:0.875rem;border:none;">Get Started</button>
    <button style="padding:0.75rem 1.5rem;border-radius:0.5rem;background:transparent;color:inherit;font-weight:500;font-size:0.875rem;border:1px solid rgba(128,128,128,0.3);">Learn More</button>
  </div>
</div>`,
  },
  {
    id: "list",
    label: "List Items",
    description: "Vertical list for stagger effects",
    html: `<div class="preview-container" style="display:flex;flex-direction:column;gap:0.5rem;padding:2rem;height:100%;justify-content:center;max-width:500px;margin:0 auto;">
  <div class="list-item element" data-hs-anim="element" style="display:flex;align-items:center;gap:1rem;padding:1rem;border-radius:0.5rem;border:1px solid rgba(128,128,128,0.15);background:rgba(128,128,128,0.03);">
    <div style="width:40px;height:40px;border-radius:50%;background:rgba(14,165,233,0.1);flex-shrink:0;"></div>
    <div><div style="font-weight:500;color:inherit;">List Item One</div><div style="font-size:0.8rem;color:inherit;opacity:0.5;">Supporting text</div></div>
  </div>
  <div class="list-item element" data-hs-anim="element" style="display:flex;align-items:center;gap:1rem;padding:1rem;border-radius:0.5rem;border:1px solid rgba(128,128,128,0.15);background:rgba(128,128,128,0.03);">
    <div style="width:40px;height:40px;border-radius:50%;background:rgba(139,92,246,0.1);flex-shrink:0;"></div>
    <div><div style="font-weight:500;color:inherit;">List Item Two</div><div style="font-size:0.8rem;color:inherit;opacity:0.5;">Supporting text</div></div>
  </div>
  <div class="list-item element" data-hs-anim="element" style="display:flex;align-items:center;gap:1rem;padding:1rem;border-radius:0.5rem;border:1px solid rgba(128,128,128,0.15);background:rgba(128,128,128,0.03);">
    <div style="width:40px;height:40px;border-radius:50%;background:rgba(245,158,11,0.1);flex-shrink:0;"></div>
    <div><div style="font-weight:500;color:inherit;">List Item Three</div><div style="font-size:0.8rem;color:inherit;opacity:0.5;">Supporting text</div></div>
  </div>
  <div class="list-item element" data-hs-anim="element" style="display:flex;align-items:center;gap:1rem;padding:1rem;border-radius:0.5rem;border:1px solid rgba(128,128,128,0.15);background:rgba(128,128,128,0.03);">
    <div style="width:40px;height:40px;border-radius:50%;background:rgba(16,185,129,0.1);flex-shrink:0;"></div>
    <div><div style="font-weight:500;color:inherit;">List Item Four</div><div style="font-size:0.8rem;color:inherit;opacity:0.5;">Supporting text</div></div>
  </div>
</div>`,
  },
];

export const DEFAULT_TEMPLATE = "heading";

/** Convert a legacy template ID to a SceneConfig for backwards compatibility */
export function templateToScene(templateId: string): SceneConfig | null {
  const scenes: Record<string, SceneConfig> = {
    heading: {
      layout: "center",
      elements: [
        { id: "t-1", type: "heading", label: "Animate This Heading", animId: "element" },
      ],
    },
    "text-block": {
      layout: "column",
      elements: [
        { id: "t-1", type: "heading", label: "Hero Heading", animId: "element" },
        { id: "t-2", type: "paragraph", label: "This is a paragraph of text that can be animated with split text, stagger effects, and more.", animId: "element" },
      ],
    },
    card: {
      layout: "center",
      elements: [
        { id: "t-1", type: "card", label: "Card Title", animId: "element" },
      ],
    },
    "cards-grid": {
      layout: "grid",
      elements: [
        { id: "t-1", type: "card", label: "Card One", animId: "element" },
        { id: "t-2", type: "card", label: "Card Two", animId: "element" },
        { id: "t-3", type: "card", label: "Card Three", animId: "element" },
      ],
    },
    hero: {
      layout: "column",
      elements: [
        { id: "t-1", type: "badge", label: "New Feature", animId: "element" },
        { id: "t-2", type: "heading", label: "Build Something Amazing", animId: "element" },
        { id: "t-3", type: "paragraph", label: "Create stunning animations with an intuitive visual timeline editor.", animId: "element" },
        { id: "t-4", type: "button", label: "Get Started", animId: "element" },
      ],
    },
    list: {
      layout: "column",
      elements: [
        { id: "t-1", type: "list-item", label: "List Item One", animId: "element" },
        { id: "t-2", type: "list-item", label: "List Item Two", animId: "element" },
        { id: "t-3", type: "list-item", label: "List Item Three", animId: "element" },
        { id: "t-4", type: "list-item", label: "List Item Four", animId: "element" },
      ],
    },
  };
  return scenes[templateId] || null;
}
