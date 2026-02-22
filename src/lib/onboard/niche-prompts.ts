export type BusinessNiche =
  | "contractor"
  | "medical"
  | "real_estate"
  | "restaurant"
  | "other";

export const NICHE_OPTIONS: { value: BusinessNiche; label: string }[] = [
  { value: "contractor", label: "Contractor / Trades" },
  { value: "medical", label: "Medical / Healthcare" },
  { value: "real_estate", label: "Real Estate" },
  { value: "restaurant", label: "Restaurant / Food" },
  { value: "other", label: "Other" },
];

const NICHE_ADDENDA: Record<BusinessNiche, string> = {
  contractor: `
## Niche: Contractor / Trades

These clients are typically not tech-savvy and want a clean, professional site without fuss. Keep questions practical.

- Always include a service_area question (text type) for geographic coverage
- Include a project_gallery question for before/after work photos
- Use tag_input for services (pre-populate from scraped data with common trade suggestions)
- Ask about licensing, certifications, and insurance (yes_no_na)
- Ask about emergency service availability (yes_no)
- Focus on trust signals: years in business, insurance, bonding
- Skip "website vibe" or style preference questions. Default to clean and professional.
- Do NOT ask about branding preferences, design inspiration, or creative direction
`.trim(),

  medical: `
## Niche: Medical / Healthcare

These clients are credential-focused and professional. Include HIPAA-aware language.

- Never collect patient information through the onboarding form
- Ask about specialties using tag_input or multi_select
- Include insurance/accepted plans question (tag_input with common plan suggestions)
- Ask about appointment scheduling preferences (yes_no or select)
- Include team_members for providers/doctors with credentials
- Focus on credentials, board certifications, hospital affiliations
- Ask about telehealth/virtual visit availability (yes_no)
- Include professional headshots upload for providers
`.trim(),

  real_estate: `
## Niche: Real Estate

These clients tend to be more brand-conscious and creative. Include personal branding questions.

- Ask about areas/neighborhoods served (tag_input)
- Include property types handled (multi_select: residential, commercial, land, luxury, etc.)
- Ask about designations and certifications (tag_input, e.g. CRS, ABR, GRI, SRES)
- Include a professional headshot/photo upload (file_upload)
- Ask about the vibe they want for their site (select with options)
- Focus on market expertise, client testimonials, and personal brand
- Ask about MLS or IDX integration needs (yes_no)
- Include a bio/about question (textarea) for their personal story
`.trim(),

  restaurant: `
## Niche: Restaurant / Food

These clients need menu-focused and ambiance-driven sites. Visuals are key.

- Ask about cuisine type and signature dishes (textarea)
- Include hours of operation question (textarea, mention different hours for different days)
- Ask about online ordering, delivery, and catering availability (yes_no for each or multi_select)
- Include menu upload (file_upload, accept PDF and images)
- Ask about reservation system preferences (yes_no or select)
- Focus on ambiance, dietary accommodations (multi_select: vegan, gluten-free, halal, kosher, etc.)
- Include food/interior photography upload (project_gallery)
- Ask about events or private dining availability (yes_no)
`.trim(),

  other: "",
};

/**
 * Builds the full system prompt by appending niche-specific addenda
 * to the base prompt template from Supabase.
 */
export function buildSystemPrompt(
  basePrompt: string,
  niche: BusinessNiche
): string {
  const addendum = NICHE_ADDENDA[niche];
  if (!addendum) return basePrompt;
  return `${basePrompt}\n\n${addendum}`;
}
