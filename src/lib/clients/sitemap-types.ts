// ════════════════════════════════════════════════════════════
// SITEMAP NODE TYPES
// ════════════════════════════════════════════════════════════

export type SitemapPageType =
  | "home"
  | "static"
  | "collection"
  | "collection_item"
  | "utility"
  | "external";

export type SitemapPageStatus =
  | "planned"
  | "in_progress"
  | "complete"
  | "deferred";

export type SitemapPageData = {
  label: string;
  path: string;
  pageType: SitemapPageType;
  status: SitemapPageStatus;
  description?: string;
  sections?: string[];
  seoTitle?: string;
  seoDescription?: string;
  collectionName?: string;
  estimatedItems?: number;
  color?: string;
  notes?: string;
  commentCount?: number;
  /** Embedded collection items — populated at render time for collection template cards */
  collectionItems?: Array<{ label: string; path: string }>;
};

// ════════════════════════════════════════════════════════════
// REACT FLOW DATA STRUCTURES
// ════════════════════════════════════════════════════════════

export type SitemapNode = {
  id: string;
  type: "sitemap-page";
  position: { x: number; y: number };
  data: SitemapPageData;
};

export type SitemapEdge = {
  id: string;
  source: string;
  target: string;
  type?: "smoothstep" | "straight" | "bezier";
  animated?: boolean;
};

export interface SitemapViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface SitemapData {
  nodes: SitemapNode[];
  edges: SitemapEdge[];
  viewport: SitemapViewport;
}

// ════════════════════════════════════════════════════════════
// DATABASE RECORD TYPES
// ════════════════════════════════════════════════════════════

export interface ClientSitemap {
  id: string;
  client_id: string;
  slug: string;
  title: string;
  package_tier: 1 | 2 | 3 | null;
  sitemap_data: SitemapData;
  is_public: boolean;
  access_token: string | null;
  allow_comments: boolean;
  status: "draft" | "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface SitemapComment {
  id: string;
  sitemap_id: string;
  node_id: string | null;
  section_name: string | null;
  parent_id: string | null;
  author_name: string;
  author_email: string | null;
  author_type: "agency" | "client" | "guest";
  content: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  replies?: SitemapComment[];
}

/** A column in the hierarchy layout — one page + optional template below */
export interface SitemapGridColumn {
  page: SitemapNode;
  template: SitemapNode | null;
}

/** Full hierarchy layout output */
export interface SitemapGridLayout {
  columns: SitemapGridColumn[];
  legalPages: SitemapNode[];
}

// ════════════════════════════════════════════════════════════
// AI GENERATION TYPES
// ════════════════════════════════════════════════════════════

export interface SitemapGenerateRequest {
  packageTier: 1 | 2 | 3;
  customPrompt?: string;
  importJson?: string;
}

// AI outputs flat nodes with parentId, we transform to react-flow format
export interface AISitemapNode {
  id: string;
  label: string;
  path: string;
  pageType: SitemapPageType;
  description?: string;
  sections?: string[];
  seoTitle?: string;
  seoDescription?: string;
  parentId: string | null;
  collectionName?: string;
  estimatedItems?: number;
}
