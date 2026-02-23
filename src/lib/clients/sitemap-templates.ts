import type { AISitemapNode } from "./sitemap-types";
import { aiNodesToSitemapNodes, buildEdgesFromParentIds } from "./sitemap-utils";
import { autoLayout } from "./sitemap-layout";
import type { SitemapData } from "./sitemap-types";

// ════════════════════════════════════════════════════════════
// PACKAGE 1: Basic ($600) — 3-5 static + 3-6 collection
// ════════════════════════════════════════════════════════════

const PACKAGE_1_NODES: AISitemapNode[] = [
  { id: "home", label: "Home", path: "/", pageType: "home", parentId: null, description: "Main landing page with hero, services overview, testimonials, and contact form", sections: ["Hero", "Services", "Testimonials", "Contact", "CTA"] },
  { id: "about", label: "About", path: "/about", pageType: "static", parentId: "home", description: "Company story, team, and values", sections: ["Hero", "Story", "Team", "CTA"] },
  { id: "services", label: "Services", path: "/services", pageType: "collection", parentId: "home", description: "All services overview", collectionName: "Services", estimatedItems: 3, sections: ["Hero", "Service Cards", "CTA"] },
  { id: "service-1", label: "Service 1", path: "/services/service-1", pageType: "collection_item", parentId: "services", description: "Individual service page", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "CTA"] },
  { id: "service-2", label: "Service 2", path: "/services/service-2", pageType: "collection_item", parentId: "services", description: "Individual service page", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "CTA"] },
  { id: "service-3", label: "Service 3", path: "/services/service-3", pageType: "collection_item", parentId: "services", description: "Individual service page", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "CTA"] },
  { id: "contact", label: "Contact", path: "/contact", pageType: "static", parentId: "home", description: "Contact form and business info", sections: ["Hero", "Form", "Map", "Info"] },
  { id: "privacy", label: "Privacy Policy", path: "/legal/privacy-policy", pageType: "utility", parentId: "home", description: "Privacy policy page" },
];

// ════════════════════════════════════════════════════════════
// PACKAGE 2: Growth ($1300) — 7-10 static + 15-25 collection
// ════════════════════════════════════════════════════════════

const PACKAGE_2_NODES: AISitemapNode[] = [
  { id: "home", label: "Home", path: "/", pageType: "home", parentId: null, description: "Main landing page", sections: ["Hero", "Services", "About Preview", "Testimonials", "FAQ", "Contact", "CTA"] },
  { id: "about", label: "About", path: "/about", pageType: "static", parentId: "home", description: "Company story and team", sections: ["Hero", "Story", "Team Grid", "Values", "CTA"] },
  { id: "services", label: "Services", path: "/services", pageType: "collection", parentId: "home", description: "All services", collectionName: "Services", estimatedItems: 5, sections: ["Hero", "Service Cards", "Process", "CTA"] },
  { id: "service-1", label: "Service 1", path: "/services/service-1", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "FAQ", "CTA"] },
  { id: "service-2", label: "Service 2", path: "/services/service-2", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "FAQ", "CTA"] },
  { id: "service-3", label: "Service 3", path: "/services/service-3", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "FAQ", "CTA"] },
  { id: "service-4", label: "Service 4", path: "/services/service-4", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "FAQ", "CTA"] },
  { id: "service-5", label: "Service 5", path: "/services/service-5", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "FAQ", "CTA"] },
  { id: "areas", label: "Service Areas", path: "/areas", pageType: "collection", parentId: "home", description: "Service area pages for local SEO", collectionName: "Service Areas", estimatedItems: 10, sections: ["Hero", "Area Grid", "CTA"] },
  { id: "area-1", label: "Area 1", path: "/areas/area-1", pageType: "collection_item", parentId: "areas", collectionName: "Service Areas", sections: ["Hero", "Services", "About", "Testimonials", "FAQ", "CTA"] },
  { id: "area-2", label: "Area 2", path: "/areas/area-2", pageType: "collection_item", parentId: "areas", collectionName: "Service Areas", sections: ["Hero", "Services", "About", "Testimonials", "FAQ", "CTA"] },
  { id: "area-3", label: "Area 3", path: "/areas/area-3", pageType: "collection_item", parentId: "areas", collectionName: "Service Areas", sections: ["Hero", "Services", "About", "Testimonials", "FAQ", "CTA"] },
  { id: "blog", label: "Blog", path: "/blog", pageType: "collection", parentId: "home", description: "Blog listing page", collectionName: "Blog Posts", estimatedItems: 4, sections: ["Hero", "Post Grid", "CTA"] },
  { id: "blog-1", label: "Blog Post 1", path: "/blog/post-1", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related Posts", "CTA"] },
  { id: "blog-2", label: "Blog Post 2", path: "/blog/post-2", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related Posts", "CTA"] },
  { id: "gallery", label: "Gallery", path: "/gallery", pageType: "collection", parentId: "home", description: "Project gallery with before/after", collectionName: "Projects", estimatedItems: 6, sections: ["Hero", "Project Grid"] },
  { id: "faq", label: "FAQ", path: "/faq", pageType: "static", parentId: "home", description: "Frequently asked questions", sections: ["Hero", "FAQ Accordion", "CTA"] },
  { id: "testimonials", label: "Testimonials", path: "/testimonials", pageType: "static", parentId: "home", description: "Customer testimonials", sections: ["Hero", "Testimonial Grid", "CTA"] },
  { id: "contact", label: "Contact", path: "/contact", pageType: "static", parentId: "home", description: "Contact form and info", sections: ["Hero", "Form", "Map", "Info"] },
  { id: "privacy", label: "Privacy Policy", path: "/legal/privacy-policy", pageType: "utility", parentId: "home" },
];

// ════════════════════════════════════════════════════════════
// PACKAGE 3: Premium ($3000) — 10-15 static + 40+ collection
// ════════════════════════════════════════════════════════════

const PACKAGE_3_NODES: AISitemapNode[] = [
  { id: "home", label: "Home", path: "/", pageType: "home", parentId: null, description: "High-conversion landing page", sections: ["Hero", "Services", "Stats", "About Preview", "Process", "Testimonials", "FAQ", "CTA"] },
  { id: "about", label: "About", path: "/about", pageType: "static", parentId: "home", description: "Company story, team, credentials", sections: ["Hero", "Story", "Team Grid", "Credentials", "Values", "CTA"] },
  // Services
  { id: "services", label: "Services", path: "/services", pageType: "collection", parentId: "home", collectionName: "Services", estimatedItems: 6, sections: ["Hero", "Service Cards", "Process", "CTA"] },
  { id: "svc-1", label: "Service 1", path: "/services/service-1", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "FAQ", "Testimonials", "CTA"] },
  { id: "svc-2", label: "Service 2", path: "/services/service-2", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "FAQ", "Testimonials", "CTA"] },
  { id: "svc-3", label: "Service 3", path: "/services/service-3", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "FAQ", "Testimonials", "CTA"] },
  { id: "svc-4", label: "Service 4", path: "/services/service-4", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "FAQ", "Testimonials", "CTA"] },
  { id: "svc-5", label: "Service 5", path: "/services/service-5", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "FAQ", "Testimonials", "CTA"] },
  { id: "svc-6", label: "Service 6", path: "/services/service-6", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Details", "Gallery", "FAQ", "Testimonials", "CTA"] },
  // Service Areas (30+)
  { id: "areas", label: "Service Areas", path: "/areas", pageType: "collection", parentId: "home", collectionName: "Service Areas", estimatedItems: 35, sections: ["Hero", "Area Grid", "Map", "CTA"] },
  { id: "area-1", label: "City 1", path: "/areas/city-1", pageType: "collection_item", parentId: "areas", collectionName: "Service Areas", sections: ["Hero", "Services", "About", "Testimonials", "FAQ", "CTA"] },
  { id: "area-2", label: "City 2", path: "/areas/city-2", pageType: "collection_item", parentId: "areas", collectionName: "Service Areas", sections: ["Hero", "Services", "About", "Testimonials", "FAQ", "CTA"] },
  { id: "area-3", label: "City 3", path: "/areas/city-3", pageType: "collection_item", parentId: "areas", collectionName: "Service Areas", sections: ["Hero", "Services", "About", "Testimonials", "FAQ", "CTA"] },
  { id: "area-4", label: "City 4", path: "/areas/city-4", pageType: "collection_item", parentId: "areas", collectionName: "Service Areas", sections: ["Hero", "Services", "About", "Testimonials", "FAQ", "CTA"] },
  { id: "area-5", label: "City 5", path: "/areas/city-5", pageType: "collection_item", parentId: "areas", collectionName: "Service Areas", sections: ["Hero", "Services", "About", "Testimonials", "FAQ", "CTA"] },
  // Blog
  { id: "blog", label: "Blog", path: "/blog", pageType: "collection", parentId: "home", collectionName: "Blog Posts", estimatedItems: 10, sections: ["Hero", "Post Grid", "Categories", "CTA"] },
  { id: "blog-1", label: "Blog Post 1", path: "/blog/post-1", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related", "CTA"] },
  { id: "blog-2", label: "Blog Post 2", path: "/blog/post-2", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related", "CTA"] },
  { id: "blog-3", label: "Blog Post 3", path: "/blog/post-3", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related", "CTA"] },
  { id: "blog-4", label: "Blog Post 4", path: "/blog/post-4", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related", "CTA"] },
  // Gallery
  { id: "gallery", label: "Gallery", path: "/gallery", pageType: "collection", parentId: "home", collectionName: "Projects", estimatedItems: 8, sections: ["Hero", "Project Grid", "Filter"] },
  { id: "gallery-1", label: "Project 1", path: "/gallery/project-1", pageType: "collection_item", parentId: "gallery", collectionName: "Projects", sections: ["Hero", "Before/After", "Details", "CTA"] },
  { id: "gallery-2", label: "Project 2", path: "/gallery/project-2", pageType: "collection_item", parentId: "gallery", collectionName: "Projects", sections: ["Hero", "Before/After", "Details", "CTA"] },
  // Resources
  { id: "resources", label: "Resources", path: "/resources", pageType: "static", parentId: "home", sections: ["Hero", "Resource Links"] },
  { id: "faq", label: "FAQ", path: "/faq", pageType: "static", parentId: "resources", sections: ["Hero", "FAQ Accordion", "CTA"] },
  { id: "testimonials", label: "Testimonials", path: "/testimonials", pageType: "static", parentId: "home", sections: ["Hero", "Testimonial Grid", "Video Testimonials", "CTA"] },
  { id: "contact", label: "Contact", path: "/contact", pageType: "static", parentId: "home", sections: ["Hero", "Form", "Map", "Info", "Emergency Contact"] },
  // Utility
  { id: "privacy", label: "Privacy Policy", path: "/legal/privacy-policy", pageType: "utility", parentId: "home" },
  { id: "terms", label: "Terms of Service", path: "/legal/terms", pageType: "utility", parentId: "home" },
];

// ════════════════════════════════════════════════════════════
// BUILD TEMPLATE DATA
// ════════════════════════════════════════════════════════════

function buildTemplate(aiNodes: AISitemapNode[]): SitemapData {
  const nodes = aiNodesToSitemapNodes(aiNodes);
  const edges = buildEdgesFromParentIds(aiNodes);
  const laidOut = autoLayout(nodes, edges);
  return {
    nodes: laidOut,
    edges,
    viewport: { x: 0, y: 0, zoom: 0.75 },
  };
}

export function getTemplate(packageTier: 1 | 2 | 3): SitemapData {
  switch (packageTier) {
    case 1:
      return buildTemplate(PACKAGE_1_NODES);
    case 2:
      return buildTemplate(PACKAGE_2_NODES);
    case 3:
      return buildTemplate(PACKAGE_3_NODES);
  }
}

export const PACKAGE_INFO = {
  1: {
    name: "Package 1 — Basic",
    price: "$600",
    description: "3-5 static pages, 3-6 collection pages. Services, basic gallery, testimonials.",
    pageRange: "~8-12 pages",
  },
  2: {
    name: "Package 2 — Growth",
    price: "$1,300",
    description: "7-10 static + 15-25 collection. Service areas, blog, advanced gallery.",
    pageRange: "~25-35 pages",
  },
  3: {
    name: "Package 3 — Premium",
    price: "$3,000",
    description: "10-15 static + 40+ collection. Advanced SEO, 30+ service areas, extensive blog.",
    pageRange: "~55-65 pages",
  },
} as const;
