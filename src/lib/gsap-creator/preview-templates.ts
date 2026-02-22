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
  <h1 class="heading element" data-hs-anim="heading" style="font-size:3rem;font-weight:700;color:inherit;font-family:inherit;line-height:1.1;">
    Animate This Heading
  </h1>
</div>`,
  },
  {
    id: "text-block",
    label: "Text Block",
    description: "Heading with paragraph text",
    html: `<div class="preview-container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:2rem;gap:1rem;max-width:600px;margin:0 auto;">
  <h2 class="heading element" data-hs-anim="text-heading" style="font-size:2.5rem;font-weight:700;color:inherit;line-height:1.1;">
    Hero Heading
  </h2>
  <p class="paragraph element" data-hs-anim="text-paragraph" style="font-size:1.125rem;color:inherit;opacity:0.7;line-height:1.6;text-align:center;">
    This is a paragraph of text that can be animated with split text, stagger effects, and more.
  </p>
</div>`,
  },
  {
    id: "card",
    label: "Card",
    description: "Single card element",
    html: `<div class="preview-container" style="display:flex;align-items:center;justify-content:center;height:100%;padding:2rem;">
  <div class="card element" data-hs-anim="card" style="padding:2rem;border-radius:1rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);max-width:400px;width:100%;">
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
  <div class="card element" data-hs-anim="card-1" style="padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);">
    <div style="width:32px;height:32px;border-radius:8px;background:rgba(14,165,233,0.15);margin-bottom:0.75rem;"></div>
    <h4 style="font-size:1rem;font-weight:600;color:inherit;margin-bottom:0.25rem;">Card One</h4>
    <p style="font-size:0.8rem;color:inherit;opacity:0.5;">Description text</p>
  </div>
  <div class="card element" data-hs-anim="card-2" style="padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);">
    <div style="width:32px;height:32px;border-radius:8px;background:rgba(139,92,246,0.15);margin-bottom:0.75rem;"></div>
    <h4 style="font-size:1rem;font-weight:600;color:inherit;margin-bottom:0.25rem;">Card Two</h4>
    <p style="font-size:0.8rem;color:inherit;opacity:0.5;">Description text</p>
  </div>
  <div class="card element" data-hs-anim="card-3" style="padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);">
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
  <span class="badge element" data-hs-anim="hero-badge" style="display:inline-block;padding:0.25rem 0.75rem;border-radius:9999px;font-size:0.75rem;font-weight:500;background:rgba(14,165,233,0.1);color:rgba(14,165,233,1);">New Feature</span>
  <h1 class="heading element" data-hs-anim="hero-heading" style="font-size:3rem;font-weight:800;color:inherit;line-height:1.05;max-width:700px;">
    Build Something Amazing
  </h1>
  <p class="paragraph element" data-hs-anim="hero-paragraph" style="font-size:1.125rem;color:inherit;opacity:0.6;max-width:500px;line-height:1.6;">
    Create stunning animations with an intuitive visual timeline editor.
  </p>
  <div class="buttons element" data-hs-anim="hero-buttons" style="display:flex;gap:0.75rem;margin-top:0.5rem;">
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
  <div class="list-item element" data-hs-anim="list-item-1" style="display:flex;align-items:center;gap:1rem;padding:1rem;border-radius:0.5rem;border:1px solid rgba(128,128,128,0.15);background:rgba(128,128,128,0.03);">
    <div style="width:40px;height:40px;border-radius:50%;background:rgba(14,165,233,0.1);flex-shrink:0;"></div>
    <div><div style="font-weight:500;color:inherit;">List Item One</div><div style="font-size:0.8rem;color:inherit;opacity:0.5;">Supporting text</div></div>
  </div>
  <div class="list-item element" data-hs-anim="list-item-2" style="display:flex;align-items:center;gap:1rem;padding:1rem;border-radius:0.5rem;border:1px solid rgba(128,128,128,0.15);background:rgba(128,128,128,0.03);">
    <div style="width:40px;height:40px;border-radius:50%;background:rgba(139,92,246,0.1);flex-shrink:0;"></div>
    <div><div style="font-weight:500;color:inherit;">List Item Two</div><div style="font-size:0.8rem;color:inherit;opacity:0.5;">Supporting text</div></div>
  </div>
  <div class="list-item element" data-hs-anim="list-item-3" style="display:flex;align-items:center;gap:1rem;padding:1rem;border-radius:0.5rem;border:1px solid rgba(128,128,128,0.15);background:rgba(128,128,128,0.03);">
    <div style="width:40px;height:40px;border-radius:50%;background:rgba(245,158,11,0.1);flex-shrink:0;"></div>
    <div><div style="font-weight:500;color:inherit;">List Item Three</div><div style="font-size:0.8rem;color:inherit;opacity:0.5;">Supporting text</div></div>
  </div>
  <div class="list-item element" data-hs-anim="list-item-4" style="display:flex;align-items:center;gap:1rem;padding:1rem;border-radius:0.5rem;border:1px solid rgba(128,128,128,0.15);background:rgba(128,128,128,0.03);">
    <div style="width:40px;height:40px;border-radius:50%;background:rgba(16,185,129,0.1);flex-shrink:0;"></div>
    <div><div style="font-weight:500;color:inherit;">List Item Four</div><div style="font-size:0.8rem;color:inherit;opacity:0.5;">Supporting text</div></div>
  </div>
</div>`,
  },
  {
    id: "features",
    label: "Features Grid",
    description: "2-column grid with feature cards",
    html: `<div class="preview-container" style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;padding:2rem;height:100%;align-content:center;">
  <div class="card element" data-hs-anim="feature-1" style="padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);">
    <div style="width:40px;height:40px;border-radius:10px;background:rgba(14,165,233,0.15);margin-bottom:0.75rem;"></div>
    <h3 style="font-size:1.125rem;font-weight:600;color:inherit;margin-bottom:0.25rem;">Fast Performance</h3>
    <p style="font-size:0.8rem;color:inherit;opacity:0.6;line-height:1.5;">Optimized for speed with minimal overhead and lazy loading.</p>
  </div>
  <div class="card element" data-hs-anim="feature-2" style="padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);">
    <div style="width:40px;height:40px;border-radius:10px;background:rgba(139,92,246,0.15);margin-bottom:0.75rem;"></div>
    <h3 style="font-size:1.125rem;font-weight:600;color:inherit;margin-bottom:0.25rem;">Easy Integration</h3>
    <p style="font-size:0.8rem;color:inherit;opacity:0.6;line-height:1.5;">Drop-in components that work with any framework.</p>
  </div>
  <div class="card element" data-hs-anim="feature-3" style="padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);">
    <div style="width:40px;height:40px;border-radius:10px;background:rgba(245,158,11,0.15);margin-bottom:0.75rem;"></div>
    <h3 style="font-size:1.125rem;font-weight:600;color:inherit;margin-bottom:0.25rem;">Type Safe</h3>
    <p style="font-size:0.8rem;color:inherit;opacity:0.6;line-height:1.5;">Full TypeScript support with autocomplete and validation.</p>
  </div>
  <div class="card element" data-hs-anim="feature-4" style="padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);">
    <div style="width:40px;height:40px;border-radius:10px;background:rgba(16,185,129,0.15);margin-bottom:0.75rem;"></div>
    <h3 style="font-size:1.125rem;font-weight:600;color:inherit;margin-bottom:0.25rem;">Accessible</h3>
    <p style="font-size:0.8rem;color:inherit;opacity:0.6;line-height:1.5;">Built with accessibility in mind, respects reduced motion.</p>
  </div>
</div>`,
  },
  {
    id: "testimonial",
    label: "Testimonial",
    description: "Centered testimonial with quote and author",
    html: `<div class="preview-container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:2rem;gap:1.5rem;max-width:550px;margin:0 auto;">
  <div class="card element" data-hs-anim="testimonial-quote" style="padding:2rem;border-radius:1rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);text-align:center;width:100%;">
    <p style="font-size:1.25rem;color:inherit;line-height:1.6;font-style:italic;opacity:0.9;">"This tool completely transformed how we build animations. The timeline editor is intuitive and powerful."</p>
  </div>
  <div class="card element" data-hs-anim="testimonial-author" style="display:flex;align-items:center;gap:1rem;">
    <div style="width:48px;height:48px;border-radius:50%;background:rgba(139,92,246,0.15);flex-shrink:0;"></div>
    <div>
      <div style="font-weight:600;color:inherit;">Sarah Chen</div>
      <div style="font-size:0.8rem;color:inherit;opacity:0.6;">Lead Developer, Acme Inc.</div>
    </div>
  </div>
</div>`,
  },
  {
    id: "cta",
    label: "Call to Action",
    description: "CTA section with heading, text, and buttons",
    html: `<div class="preview-container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:2rem;text-align:center;gap:1.25rem;">
  <h2 class="heading element" data-hs-anim="cta-heading" style="font-size:2.5rem;font-weight:700;color:inherit;line-height:1.1;max-width:600px;">
    Ready to Get Started?
  </h2>
  <p class="paragraph element" data-hs-anim="cta-text" style="font-size:1.125rem;color:inherit;opacity:0.6;max-width:480px;line-height:1.6;">
    Join thousands of developers building better animations with our tools.
  </p>
  <div class="buttons element" data-hs-anim="cta-buttons" style="display:flex;gap:0.75rem;margin-top:0.5rem;">
    <button style="padding:0.75rem 1.5rem;border-radius:0.5rem;background:rgba(14,165,233,1);color:white;font-weight:500;font-size:0.875rem;border:none;">Start Free Trial</button>
    <button style="padding:0.75rem 1.5rem;border-radius:0.5rem;background:transparent;color:inherit;font-weight:500;font-size:0.875rem;border:1px solid rgba(128,128,128,0.3);">View Pricing</button>
  </div>
</div>`,
  },
  {
    id: "stats",
    label: "Stats Row",
    description: "Horizontal row of stat items",
    html: `<div class="preview-container" style="display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;padding:2rem;height:100%;align-content:center;">
  <div class="box element" data-hs-anim="stat-1" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);gap:0.25rem;">
    <div style="font-size:2.5rem;font-weight:700;color:inherit;">10K+</div>
    <div style="font-size:0.8rem;color:inherit;opacity:0.6;">Users</div>
  </div>
  <div class="box element" data-hs-anim="stat-2" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);gap:0.25rem;">
    <div style="font-size:2.5rem;font-weight:700;color:inherit;">50M</div>
    <div style="font-size:0.8rem;color:inherit;opacity:0.6;">Animations</div>
  </div>
  <div class="box element" data-hs-anim="stat-3" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);gap:0.25rem;">
    <div style="font-size:2.5rem;font-weight:700;color:inherit;">99%</div>
    <div style="font-size:0.8rem;color:inherit;opacity:0.6;">Uptime</div>
  </div>
  <div class="box element" data-hs-anim="stat-4" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;border-radius:0.75rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);gap:0.25rem;">
    <div style="font-size:2.5rem;font-weight:700;color:inherit;">4.9</div>
    <div style="font-size:0.8rem;color:inherit;opacity:0.6;">Rating</div>
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
        { id: "t-1", type: "heading", label: "Animate This Heading", animId: "heading" },
      ],
    },
    "text-block": {
      layout: "column",
      elements: [
        { id: "t-1", type: "heading", label: "Hero Heading", animId: "text-heading" },
        { id: "t-2", type: "paragraph", label: "This is a paragraph of text that can be animated with split text, stagger effects, and more.", animId: "text-paragraph" },
      ],
    },
    card: {
      layout: "center",
      elements: [
        { id: "t-1", type: "card", label: "Card Title", animId: "card" },
      ],
    },
    "cards-grid": {
      layout: "grid",
      elements: [
        { id: "t-1", type: "card", label: "Card One", animId: "card-1" },
        { id: "t-2", type: "card", label: "Card Two", animId: "card-2" },
        { id: "t-3", type: "card", label: "Card Three", animId: "card-3" },
      ],
    },
    hero: {
      layout: "column",
      elements: [
        { id: "t-1", type: "badge", label: "New Feature", animId: "hero-badge" },
        { id: "t-2", type: "heading", label: "Build Something Amazing", animId: "hero-heading" },
        { id: "t-3", type: "paragraph", label: "Create stunning animations with an intuitive visual timeline editor.", animId: "hero-paragraph" },
        { id: "t-4", type: "button", label: "Get Started", animId: "hero-buttons" },
      ],
    },
    list: {
      layout: "column",
      elements: [
        { id: "t-1", type: "list-item", label: "List Item One", animId: "list-item-1" },
        { id: "t-2", type: "list-item", label: "List Item Two", animId: "list-item-2" },
        { id: "t-3", type: "list-item", label: "List Item Three", animId: "list-item-3" },
        { id: "t-4", type: "list-item", label: "List Item Four", animId: "list-item-4" },
      ],
    },
    features: {
      layout: "grid",
      elements: [
        { id: "t-1", type: "card", label: "Fast Performance", animId: "feature-1" },
        { id: "t-2", type: "card", label: "Easy Integration", animId: "feature-2" },
        { id: "t-3", type: "card", label: "Type Safe", animId: "feature-3" },
        { id: "t-4", type: "card", label: "Accessible", animId: "feature-4" },
      ],
    },
    testimonial: {
      layout: "column",
      elements: [
        { id: "t-1", type: "card", label: "This tool completely transformed how we build animations.", animId: "testimonial-quote" },
        { id: "t-2", type: "card", label: "Sarah Chen", animId: "testimonial-author" },
      ],
    },
    cta: {
      layout: "column",
      elements: [
        { id: "t-1", type: "heading", label: "Ready to Get Started?", animId: "cta-heading" },
        { id: "t-2", type: "paragraph", label: "Join thousands of developers building better animations with our tools.", animId: "cta-text" },
        { id: "t-3", type: "button", label: "Start Free Trial", animId: "cta-buttons" },
      ],
    },
    stats: {
      layout: "grid",
      elements: [
        { id: "t-1", type: "box", label: "10K+", animId: "stat-1" },
        { id: "t-2", type: "box", label: "50M", animId: "stat-2" },
        { id: "t-3", type: "box", label: "99%", animId: "stat-3" },
        { id: "t-4", type: "box", label: "4.9", animId: "stat-4" },
      ],
    },
  };
  return scenes[templateId] || null;
}
