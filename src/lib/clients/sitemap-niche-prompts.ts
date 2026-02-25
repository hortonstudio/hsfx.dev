import type { BusinessNiche } from "@/lib/onboard/niche-prompts";

const SITEMAP_NICHE_ADDENDA: Record<BusinessNiche, string> = {
  contractor: `
## Niche: Contractor / Trades

Structure the sitemap for maximum local SEO impact using Hub + Template pairs:

- Services: Static hub page (Services Grid) + collection template (Service Details, Before/After Gallery, Process Steps, Pricing Table, FAQ Accordion, Testimonials, CTA) + individual collection_items for each trade specialty.
- Services should be granular — separate items for each specialty (e.g., "Roof Repair" and "Roof Replacement" as separate items, not just "Roofing").
- Service Areas: Static hub page (Area Map, Services Grid) + collection template (Area Services, Testimonials, FAQ Accordion, Map, CTA) + individual collection_items for each city/town. Target "[Service] in [City]" keywords.
- Service Areas: AT MOST 5 area items for Package 1-2, AT MOST 10 for Package 3.
- Gallery/Projects: Static hub + collection template with estimatedItems. No individual items.
- Blog: Static hub + collection template with estimatedItems. No individual items.
- FAQ and Testimonials: Static pages only (no template needed).
- About page should highlight: years in business, licensing, insurance, bonding, certifications.
- Contact page should include emergency service info if applicable.
- If the KB mentions financing, include a Financing static page.
`.trim(),

  medical: `
## Niche: Medical / Healthcare

Structure the sitemap for trust and patient conversion using Hub + Template pairs:

- Services/Specialties: Static hub page (Services Grid) + collection template (Service Details, FAQ Accordion, Testimonials, CTA) + individual collection_items for each specialty/treatment.
- Providers/Team: Static hub page (Team Grid) + collection template (Team Member, Credentials, Service Details, Testimonials, CTA) + individual collection_items for each provider.
- Include an "Insurance" or "Patient Resources" static page listing accepted plans.
- If applicable, Locations: Static hub + collection template + individual items for each location.
- About page should highlight credentials, accreditations, years of practice, mission.
- Blog: Static hub + collection template with estimatedItems. Focus on patient education topics.
- Include a "New Patients" or "First Visit" static page with what to expect.
`.trim(),

  real_estate: `
## Niche: Real Estate

Structure the sitemap for agent branding and area expertise using Hub + Template pairs:

- Neighborhoods/Areas: Static hub page (Area Map, Services Grid) + collection template (Area Services, Stats/Numbers, Gallery Grid, Testimonials, CTA) + individual collection_items for each area.
- Services: Static hub page (Services Grid) + collection template (Service Details, Process Steps, CTA) + individual items (Buying, Selling, Investing, Relocation, etc.).
- About page should be a strong personal brand page: Hero, Story/History, Credentials, Stats/Numbers, Testimonials, CTA
- Include a "Testimonials" static page — social proof is critical for real estate.
- If applicable, include "Listings" as a static page or external link to IDX/MLS.
- Blog: Static hub + collection template with estimatedItems. Cover market reports, home tips, neighborhood guides.
- Include a "Home Valuation" or "Free CMA" landing page as a static page with a strong CTA.
`.trim(),

  restaurant: `
## Niche: Restaurant / Food Service

Structure the sitemap for menu discovery and reservations using Hub + Template pairs:

- Menu: Static hub page with menu overview OR "Menu Categories" as static hub + collection template + items (Appetizers, Mains, Desserts, Drinks).
- If multiple locations: Static hub + collection template + individual items with hours, address, map.
- Include a "Catering" or "Private Events" static page if applicable.
- About page: Hero, Story/History, Team Grid (chef, owners), Values, CTA
- Gallery: Static hub + collection template with estimatedItems for food photography and ambiance shots.
- Blog: Static hub + collection template with estimatedItems. Cover seasonal menus, events, chef spotlights.
- Contact page should prominently feature reservation options.
- Include hours of operation info on relevant pages.
`.trim(),

  other: `
## Niche: General Business

Structure the sitemap based on the knowledge base content using Hub + Template pairs:

- Services: Static hub page + collection template + individual items if the KB lists specific offerings.
- If the business serves specific areas: Service Areas static hub + collection template + city items.
- About page: Hero, Story/History, Team Grid (if team info available), Values, CTA
- Contact page: Hero, Contact Form, Map, CTA
- Gallery/Portfolio and Blog: Static hub + collection template with estimatedItems. No individual items.
- FAQ and Testimonials: Static pages only (no template needed).
- Focus on the business's primary conversion goal (lead form, phone call, booking, etc.).
`.trim(),
};

/**
 * Appends niche-specific sitemap instructions to the base prompt.
 */
export function buildSitemapPrompt(
  basePrompt: string,
  niche: BusinessNiche | string
): string {
  const addendum = SITEMAP_NICHE_ADDENDA[niche as BusinessNiche];
  if (!addendum) return basePrompt;
  return `${basePrompt}\n\n${addendum}`;
}
