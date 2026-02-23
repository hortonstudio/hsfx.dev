export interface StockImage {
  id: string;
  name: string;
  category: string;
  image_url: string;
  width: number | null;
  height: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const STOCK_IMAGE_CATEGORIES = [
  "roofing",
  "plumbing",
  "hvac",
  "landscaping",
  "electrical",
  "painting",
  "cleaning",
  "construction",
  "hero",
  "about",
  "team",
  "tools-equipment",
] as const;

export type StockImageCategory = (typeof STOCK_IMAGE_CATEGORIES)[number];
