import type { SceneElement, SceneElementType, SceneConfig } from "./types";

export interface ElementTypeInfo {
  type: SceneElementType;
  label: string;
  icon: string; // short icon description for UI
}

export const ELEMENT_TYPES: ElementTypeInfo[] = [
  { type: "heading", label: "Heading", icon: "H1" },
  { type: "paragraph", label: "Paragraph", icon: "P" },
  { type: "card", label: "Card", icon: "Card" },
  { type: "box", label: "Box", icon: "Box" },
  { type: "button", label: "Button", icon: "Btn" },
  { type: "badge", label: "Badge", icon: "Tag" },
  { type: "image", label: "Image", icon: "Img" },
  { type: "list-item", label: "List Item", icon: "Li" },
  { type: "divider", label: "Divider", icon: "HR" },
];

/** Returns styled HTML for a single scene element */
export function renderSceneElement(el: SceneElement): string {
  const dataAttrs = `data-hs-anim="${el.animId}" data-scene-id="${el.id}"`;

  switch (el.type) {
    case "heading":
      return `<h1 ${dataAttrs} style="font-size:3rem;font-weight:700;color:inherit;font-family:inherit;line-height:1.1;text-align:center;">${el.label}</h1>`;

    case "paragraph":
      return `<p ${dataAttrs} style="font-size:1.125rem;color:inherit;opacity:0.7;line-height:1.6;max-width:500px;text-align:center;">${el.label}</p>`;

    case "card":
      return `<div ${dataAttrs} style="padding:2rem;border-radius:1rem;border:1px solid rgba(128,128,128,0.2);background:rgba(128,128,128,0.05);max-width:400px;width:100%;">
  <div style="width:48px;height:48px;border-radius:12px;background:rgba(14,165,233,0.1);margin-bottom:1rem;"></div>
  <h3 style="font-size:1.25rem;font-weight:600;color:inherit;margin-bottom:0.5rem;">${el.label}</h3>
  <p style="font-size:0.875rem;color:inherit;opacity:0.6;line-height:1.5;">Card description text that explains something interesting about this feature.</p>
</div>`;

    case "box":
      return `<div ${dataAttrs} style="width:120px;height:120px;border-radius:0.75rem;background:rgba(14,165,233,0.2);border:1px solid rgba(14,165,233,0.3);"></div>`;

    case "button":
      return `<button ${dataAttrs} style="padding:0.75rem 1.5rem;border-radius:0.5rem;background:rgba(14,165,233,1);color:white;font-weight:500;font-size:0.875rem;border:none;cursor:pointer;">${el.label}</button>`;

    case "badge":
      return `<span ${dataAttrs} style="display:inline-block;padding:0.25rem 0.75rem;border-radius:9999px;font-size:0.75rem;font-weight:500;background:rgba(14,165,233,0.1);color:rgba(14,165,233,1);">${el.label}</span>`;

    case "image":
      return `<div ${dataAttrs} style="width:300px;height:200px;border-radius:0.75rem;background:rgba(128,128,128,0.1);border:1px solid rgba(128,128,128,0.2);display:flex;align-items:center;justify-content:center;">
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(128,128,128,0.4)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
</div>`;

    case "list-item":
      return `<div ${dataAttrs} style="display:flex;align-items:center;gap:1rem;padding:1rem;border-radius:0.5rem;border:1px solid rgba(128,128,128,0.15);background:rgba(128,128,128,0.03);width:100%;max-width:500px;">
  <div style="width:40px;height:40px;border-radius:50%;background:rgba(14,165,233,0.1);flex-shrink:0;"></div>
  <div>
    <div style="font-weight:500;color:inherit;">${el.label}</div>
    <div style="font-size:0.8rem;color:inherit;opacity:0.5;">Supporting text</div>
  </div>
</div>`;

    case "divider":
      return `<hr ${dataAttrs} style="width:100%;border:none;border-top:1px solid rgba(128,128,128,0.2);margin:0;" />`;

    default:
      return `<div ${dataAttrs}>${el.label}</div>`;
  }
}

const LAYOUT_STYLES: Record<SceneConfig["layout"], string> = {
  column:
    "display:flex;flex-direction:column;gap:1.5rem;padding:2rem;align-items:center;justify-content:center;min-height:100%;",
  center:
    "display:flex;flex-wrap:wrap;gap:1.5rem;padding:2rem;align-items:center;justify-content:center;min-height:100%;",
  grid: "display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1.5rem;padding:2rem;align-content:center;min-height:100%;",
};

/** Returns the full scene HTML with layout wrapper and all elements */
export function renderScene(scene: SceneConfig): string {
  const layoutStyle = LAYOUT_STYLES[scene.layout];
  const elementsHtml = scene.elements
    .map((el) => renderSceneElement(el))
    .join("\n  ");

  return `<div class="preview-container" style="${layoutStyle}">
  ${elementsHtml}
</div>`;
}
