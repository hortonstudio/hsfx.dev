import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { MockupConfig } from "@/lib/clients/types";

export const maxDuration = 30;

// Hardcoded demo data — a realistic roofing company mockup
const DEMO_CONFIG: MockupConfig = {
  master_json: {
    config: {
      logo: { src: "", alt: "DFW Roofing Pro" },
      company: "DFW Roofing Pro",
      email: "info@dfwroofingpro.com",
      phone: "(214) 555-0192",
      address: "4521 Elm St, Dallas, TX 75201",
      socials: {
        facebook: "https://facebook.com/dfwroofingpro",
        instagram: "https://instagram.com/dfwroofingpro",
        youtube: "",
        tiktok: "",
        x: "",
        linkedin: "",
        pinterest: "",
      },
    },
    navbar: {
      top_bar: {
        show: true,
        map: { show: true, text: "Serving all of DFW", href: "#service-area" },
      },
      nav_links: [
        { text: "About", href: "#about" },
        {
          text: "Services",
          dropdown: [
            { text: "Roof Replacement", href: "#services" },
            { text: "Storm Damage Repair", href: "#services" },
            { text: "Free Inspections", href: "#services" },
          ],
        },
        {
          text: "Areas",
          dropdown: [
            { text: "Dallas", href: "#areas" },
            { text: "Fort Worth", href: "#areas" },
            { text: "Plano", href: "#areas" },
          ],
        },
        { text: "FAQ", href: "#faq" },
      ],
      cta: { text: "Get a Free Quote" },
    },
    footer: {
      footer_nav: [
        { text: "Home", href: "#" },
        { text: "Services", href: "#services" },
        { text: "About", href: "#about" },
        { text: "FAQ", href: "#faq" },
        { text: "Contact", href: "#contact" },
      ],
      footer_groups: [
        {
          heading: "Site",
          links: [
            { text: "Home", href: "#" },
            { text: "About", href: "#about" },
            { text: "FAQ", href: "#faq" },
            { text: "Contact", href: "#contact" },
          ],
        },
        {
          heading: "Services",
          links: [
            { text: "Roof Replacement", href: "#services" },
            { text: "Storm Damage Repair", href: "#services" },
            { text: "Free Inspections", href: "#services" },
          ],
        },
        {
          heading: "Service Areas",
          links: [
            { text: "Dallas", href: "#areas" },
            { text: "Fort Worth", href: "#areas" },
            { text: "Plano", href: "#areas" },
            { text: "Arlington", href: "#areas" },
          ],
        },
      ],
    },
    services: {
      cards: [
        {
          image_url: "",
          heading: "Roof Replacement",
          paragraph:
            "Full residential and commercial roof replacement with premium materials and a 10-year workmanship warranty.",
        },
        {
          image_url: "",
          heading: "Storm Damage Repair",
          paragraph:
            "Fast response to hail and wind damage. We work directly with your insurance to make the process easy.",
        },
        {
          image_url: "",
          heading: "Free Inspections",
          paragraph:
            "No-obligation roof inspections for homeowners after any major weather event in the DFW area.",
        },
      ],
    },
    process: {
      steps: [
        {
          heading: "Schedule Your Free Inspection",
          paragraph:
            "We come to you and assess your roof at no cost. No pressure, no obligation.",
          features: ["Same-day availability", "Full damage report included"],
        },
        {
          heading: "We Handle the Insurance Claim",
          paragraph:
            "Our team works directly with your insurance adjuster so you don't have to.",
          features: [
            "Direct adjuster communication",
            "Claim documentation provided",
          ],
        },
        {
          heading: "Fast Professional Installation",
          paragraph:
            "Most jobs completed in a single day with premium materials and a 10-year workmanship warranty.",
          features: ["Single day completion", "10-year workmanship warranty"],
        },
      ],
    },
    stats_benefits: {
      cards: [
        { icon_svg: "", heading: "250+", paragraph: "5-Star Reviews" },
        { icon_svg: "", heading: "12+", paragraph: "Years in Business" },
        { icon_svg: "", heading: "20+", paragraph: "Cities Served" },
        { icon_svg: "", heading: "1,000+", paragraph: "Jobs Completed" },
      ],
    },
    testimonials: {
      top_row: [
        {
          review:
            "The crew showed up on time, knocked out our entire roof in one day, and cleaned up everything. Couldn't be happier with how it turned out.",
          name: "James R.",
        },
        {
          review:
            "They handled our insurance claim from start to finish. Made the whole process easy and stress free. Highly recommend.",
          name: "Maria T.",
        },
        {
          review:
            "Professional, fast, and honest. Got three quotes and these guys were the most upfront about what actually needed to be done.",
          name: "Derek W.",
        },
        {
          review:
            "Had storm damage and they came out the next morning. Roof was done two days later. Great communication throughout.",
          name: "Ashley M.",
        },
      ],
      bottom_row: [
        {
          review:
            "Free inspection, no pressure, fair price. They found damage I didn't even know I had and worked directly with my insurance.",
          name: "Chris P.",
        },
        {
          review:
            "Been in our home 12 years and this was the smoothest contractor experience we've ever had. Would absolutely call them again.",
          name: "Sandra L.",
        },
        {
          review:
            "Showed up when they said they would, did exactly what they quoted, and left the yard cleaner than they found it.",
          name: "Tony B.",
        },
        {
          review:
            "Great value, great crew. Our neighbors saw the work and already asked for their number. That says everything.",
          name: "Rachel K.",
        },
      ],
    },
    faq: {
      items: [
        {
          question: "Do you offer free inspections?",
          answer:
            "Yes, we offer completely free no-obligation roof inspections for homeowners across the Dallas-Fort Worth area. We'll assess your roof and give you an honest report.",
        },
        {
          question: "How long does a roof replacement take?",
          answer:
            "Most residential replacements are completed in a single day. Larger or more complex roofs may take two days. We always clean up completely before we leave.",
        },
        {
          question: "Do you work with insurance claims?",
          answer:
            "Absolutely. We work directly with your insurance adjuster and handle all the documentation to make the process as easy as possible for you.",
        },
        {
          question: "What areas do you serve?",
          answer:
            "We serve the entire Dallas-Fort Worth metroplex including Dallas, Fort Worth, Plano, Arlington, Frisco, McKinney, and surrounding cities.",
        },
        {
          question: "What kind of warranty do you offer?",
          answer:
            "Every roof we install comes with a 10-year workmanship warranty in addition to the manufacturer's material warranty, which typically covers 25-50 years.",
        },
      ],
    },
    contact: {
      form: {
        inputs: {
          name: { label: "Name *", placeholder: "Full Name" },
          phone: { label: "Phone *", placeholder: "(000) 000-0000" },
          email: { label: "Email *", placeholder: "email@email.com" },
          address: {
            label: "Service Address *",
            placeholder: "1001 Main St, Dallas, TX",
          },
        },
        textarea: {
          notes: {
            label: "Notes",
            placeholder: "Tell us about your roofing project...",
          },
        },
        checkbox_text:
          "I consent to receive SMS & Emails from DFW Roofing Pro regarding their services.",
        submit_button: "Get a Free Estimate",
      },
    },
  },
  navbar_variant: "Full With Top",
  footer_variant: "Full",
  hero_tag: "Dallas-Fort Worth's Trusted Roofers",
  hero_heading: "Expert Roofing You Can Count On",
  hero_paragraph:
    "From storm damage repairs to full replacements, DFW Roofing Pro delivers quality craftsmanship backed by a 10-year warranty. Free inspections, no pressure.",
  hero_button_1_text: "Get a Free Quote",
  hero_button_2_text: "Our Services",
  hero_variant: "Full Height Left Align",
  hero_image: "",
  services_variant: "Three Grid",
  services_tag: "What We Do",
  services_heading: "Roofing Services Built on Trust",
  services_paragraph:
    "Whether you need a full replacement or emergency storm repair, our experienced crew handles it all with quality materials and honest pricing.",
  services_button: "Learn More",
  process_variant: "Sticky List",
  process_tag: "Our Process",
  process_heading: "Simple from Start to Finish",
  process_paragraph:
    "We make roofing easy. From your first call to the final nail, here's how we work.",
  process_button: "Schedule Inspection",
  about_tag: "About Us",
  about_heading: "Family Owned, Community Driven",
  about_subheading:
    "DFW Roofing Pro has been serving the Dallas-Fort Worth area for over 12 years. We treat every home like our own and every customer like family.",
  about_button_1: "Get a Free Quote",
  about_button_2: "Learn More",
  about_image: "",
  stats_benefits_visibility: "Statistics",
  testimonials_tag: "Testimonials",
  testimonials_heading: "What Our Customers Say",
  testimonials_paragraph: "* Verified Reviews from Google",
  faq_variant: "Two Grid",
  faq_tag: "FAQ",
  faq_heading: "Common Questions",
  faq_paragraph:
    "Got questions? We've got answers. Here are the most common things homeowners ask us.",
  cta_tag: "Ready to Get Started?",
  cta_heading: "Get Your Free Roof Inspection Today",
  cta_paragraph:
    "No obligation, no pressure. Just an honest assessment of your roof from a team you can trust.",
  cta_button_1: "Schedule Inspection",
  cta_button_2: "Call Now",
  contact_variant: "Two Grid",
  contact_tag: "Contact Us",
  contact_heading: "Let's Talk About Your Roof",
  contact_paragraph:
    "Fill out the form below and we'll get back to you within 24 hours. Or call us directly for immediate assistance.",
  css: {
    brand_1: "#1e40af",
    brand_1_text: "#ffffff",
    brand_2: "#dc2626",
    brand_2_text: "#ffffff",
    dark_900: "#000007",
    dark_800: "#141414",
    light_100: "#fafbfc",
    light_200: "#ebebeb",
    radius: "rounded",
    theme: "light",
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch existing mockup to preserve logo_url and WF IDs
  const { data: existingMockup } = await supabase
    .from("client_mockups")
    .select("*")
    .eq("client_id", id)
    .maybeSingle();

  // Preserve logo_url in the demo config
  const mockupConfig = { ...DEMO_CONFIG };
  const logoUrl = existingMockup?.logo_url ?? "";
  mockupConfig.master_json = {
    ...mockupConfig.master_json,
    config: {
      ...mockupConfig.master_json.config,
      logo: { ...mockupConfig.master_json.config.logo, src: logoUrl },
    },
  };

  // Save to DB as draft — Webflow push is a separate step
  const { data: mockupRow, error: upsertError } = await supabase
    .from("client_mockups")
    .upsert(
      {
        client_id: id,
        webflow_item_id: existingMockup?.webflow_item_id ?? "",
        webflow_url: existingMockup?.webflow_url ?? "",
        config: mockupConfig,
        logo_url: logoUrl,
        status: "draft",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    )
    .select()
    .single();

  if (upsertError) {
    console.error("Failed to save mockup:", upsertError);
    return NextResponse.json(
      { error: "Failed to save mockup" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    mockup: mockupRow,
    demo: true,
  });
}
