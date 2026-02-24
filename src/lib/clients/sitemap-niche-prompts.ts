import type { BusinessNiche } from "@/lib/onboard/niche-prompts";

const SITEMAP_NICHE_ADDENDA: Record<BusinessNiche, string> = {
  contractor: `
## Niche: Contractor / Trades

Structure the sitemap for maximum local SEO impact:

- MUST include a "Service Areas" collection with individual city/town pages. Each area page should target "[Service] in [City]" keywords.
- Each service area page sections: Hero, Area Services, Testimonials, FAQ Accordion, Map, CTA
- Services should be granular — separate pages for each trade specialty (e.g., "Roof Repair" and "Roof Replacement" as separate items, not just "Roofing").
- Service item sections: Hero, Service Details, Before/After Gallery, Process Steps, Pricing Table, FAQ Accordion, Testimonials, CTA
- Service Areas: Generate AT MOST 5 service area pages for Package 1-2, AT MOST 10 for Package 3. Focus on the closest/most important cities from the KB.
- Gallery/Projects: TEMPLATE-ONLY. Just the collection page with estimatedItems, no individual project items.
- Blog: TEMPLATE-ONLY. Just the collection page with estimatedItems, no individual blog post items.
- FAQ and Testimonials: TEMPLATE-ONLY static pages (not collections, no items).
- About page should highlight: years in business, licensing, insurance, bonding, certifications.
- Contact page should include emergency service info if applicable.
- If the KB mentions financing, include a Financing static page.
- Common collections: Services, Service Areas (itemized); Gallery, Blog (template-only)
`.trim(),

  medical: `
## Niche: Medical / Healthcare

Structure the sitemap for trust and patient conversion:

- MUST include a "Services" or "Specialties" collection with individual specialty/treatment pages.
- Include a "Providers" or "Team" collection with individual provider bio pages highlighting credentials, specialties, education.
- Provider page sections: Hero, Team Member, Credentials, Service Details, Testimonials, CTA
- Include an "Insurance" or "Patient Resources" static page listing accepted plans.
- If applicable, include a "Locations" collection for multi-location practices.
- Service/specialty page sections: Hero, Service Details, FAQ Accordion, Testimonials, CTA
- About page should highlight credentials, accreditations, years of practice, mission.
- Blog posts should focus on patient education topics.
- Include a "New Patients" or "First Visit" static page with what to expect.
- Common collections: Services/Specialties, Providers, Locations, Blog
`.trim(),

  real_estate: `
## Niche: Real Estate

Structure the sitemap for agent branding and area expertise:

- MUST include a "Neighborhoods" or "Areas" collection with individual area pages for local SEO.
- Each area page sections: Hero, Area Services, Stats/Numbers, Gallery Grid, Testimonials, CTA
- Include a "Services" collection (Buying, Selling, Investing, Relocation, etc.).
- About page should be a strong personal brand page: Hero, Story/History, Credentials, Stats/Numbers, Testimonials, CTA
- Include a "Testimonials" page — social proof is critical for real estate.
- If applicable, include "Listings" collection or link to IDX/MLS.
- Blog posts should cover market reports, home tips, neighborhood guides.
- Include a "Home Valuation" or "Free CMA" landing page as a static page with a strong CTA.
- Common collections: Services, Neighborhoods/Areas, Blog
`.trim(),

  restaurant: `
## Niche: Restaurant / Food Service

Structure the sitemap for menu discovery and reservations:

- MUST include a "Menu" static page or "Menu Categories" collection (Appetizers, Mains, Desserts, Drinks).
- If multiple locations, include a "Locations" collection with individual location pages showing hours, address, map.
- Include a "Catering" or "Private Events" static page if applicable.
- About page: Hero, Story/History, Team Grid (chef, owners), Values, CTA
- Gallery page with food photography and ambiance shots.
- Blog posts can cover seasonal menus, events, chef spotlights.
- Contact page should prominently feature reservation options.
- Include hours of operation info on relevant pages.
- Common collections: Menu (or Menu Categories), Locations, Blog, Gallery
`.trim(),

  other: "",
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
