import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { MockupConfig } from "@/lib/clients/types";
import type { AISitemapNode } from "@/lib/clients/sitemap-types";
import { aiNodesToSitemapNodes, buildEdgesFromParentIds, generateSlug } from "@/lib/clients/sitemap-utils";
import { autoLayout } from "@/lib/clients/sitemap-layout";

export const maxDuration = 30;

// ════════════════════════════════════════════════════════════
// COMPILED KNOWLEDGE BASE
// ════════════════════════════════════════════════════════════

const COMPILED_KB = `# Cole's Plumbing — Client Knowledge Base

## Business Overview
- **Business Name:** Cole's Plumbing (also referenced as Cole's Plumbing Dallas)
- **Owner/Main Plumber:** Chad Cole
- **Address:** 1325 Whitlock Lane Suite 309, Carrollton, TX 75006
- **Phone:** (972) 210-9033
- **License:** Responsible Master Plumber License: RM-40414 (Texas State Board of Plumbing Examiners)
- **Years in Business:** 24+ years
- **Type:** Family owned & operated
- **Fully Licensed & Insured**

## Google Reviews
- **Rating:** 4.9/5 stars
- **Total Reviews:** 157+
- **Common Praise:** Reasonable/great pricing, fast response, professional, knowledgeable, clear communication, emergency availability, honest
- **Recurring Themes:** Chad personally handles most jobs, arrives on time, explains issues clearly, fair pricing, same-day/next-day service, works weekends

## Services Offered

### Residential Plumbing
- Faucet repair and installation
- Water heater repair and installation (including tankless)
- Water line repair & installation
- Gas line repair and installation
- Gas leak detection
- Sewer repair and installation
- Sewer camera inspection
- Hydrostatic sewer testing
- Pipe leak repair
- Under slab plumbing repair (plumbing repair under concrete slab)
- Drain cleaning / blockage clearing
- Kitchen and bathroom remodels
- Sprinkler valve replacement
- Emergency plumbing repairs (24/7 availability)

### Commercial Plumbing
- Build-outs and renovations
- Complete remodels
- Industrial bathroom upgrades
- Commercial plumbing maintenance

## Service Areas
**IMPORTANT: Client relocated to Carrollton and wants to keep service areas SMALLER (not all of DFW)**

Current service areas:
1. The Colony, TX
2. Lewisville, TX
3. Carrollton, TX
4. Coppell, TX
5. Grapevine, TX

## Key Selling Points
1. **24+ years of experience** — Chad is a master plumber with decades of expertise
2. **Family owned & operated** — personal service, not a corporate chain
3. **Fully Licensed & Insured** — Master Plumber License RM-40414
4. **Affordable pricing** — consistently praised for fair, reasonable rates
5. **Emergency availability** — same-day service, works weekends
6. **100% Customer Satisfaction** — clear explanations, no surprises
7. **4.9 star rating** with 157+ Google reviews
8. **Fast response times** — often arrives within hours of first contact

## Brand Voice & Tone
- Down-to-earth, honest, no-nonsense
- "You work too hard to watch your money go down the drain"
- Emphasis on affordability and reliability
- Chad-centric — customers know and trust Chad personally
- Community-focused, local expertise

## Social Media
- Facebook: Active
- Google Business: Active (primary review platform)
- Yelp: Listed

## Competitors / Market Context
- Located in Denton County / North DFW suburbs
- Competes with larger plumbing companies by offering personal service and better pricing
- Strong word-of-mouth referral network
- Customers frequently mention choosing Cole's after reading reviews

## Real Customer Testimonials (Selected)
- "Reasonable price. We had a great experience with Chad! They were reliable and professional. Responded quickly, arrived on time, and clearly explained the issue before starting the repair." — J Guidry
- "Chad responded promptly and efficiently. He is really professional and his pricing is more than fair." — Sandra Ford
- "Chad is not just any plumber he is a master plumber with 25+ years of experience. Knowledgeable, professional, and informative." — Tiffany Sharkey
- "Our hot water heater failed the day before a major ice storm. Chad came out and had us back up and running. Can't recommend him highly enough!" — Marcia Moody
- "Cole's Plumbing came through for my emergency. Chad was at my house within two hours. Explained everything and kept it affordable." — Troy Cubberly
- "I've used Cole for many years. Every time I've needed him it was an emergency and he always came through." — Charlie Jones
`;

// ════════════════════════════════════════════════════════════
// MOCKUP CONFIG
// ════════════════════════════════════════════════════════════

const MOCKUP_CONFIG: MockupConfig = {
  master_json: {
    config: {
      logo: { src: "", alt: "Cole's Plumbing" },
      company: "Cole's Plumbing",
      email: "",
      phone: "(972) 210-9033",
      address: "1325 Whitlock Lane Suite 309, Carrollton, TX 75006",
      socials: {
        facebook: "https://facebook.com/colesplumbing",
        instagram: "",
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
        map: { show: true, text: "Serving Carrollton & North DFW", href: "#service-area" },
      },
      nav_links: [
        { text: "About", href: "#about" },
        {
          text: "Services",
          dropdown: [
            { text: "Water Heater Repair", href: "#services" },
            { text: "Sewer Repair", href: "#services" },
            { text: "Gas Leak Detection", href: "#services" },
            { text: "Emergency Plumbing", href: "#services" },
          ],
        },
        {
          text: "Areas",
          dropdown: [
            { text: "Carrollton", href: "#areas" },
            { text: "The Colony", href: "#areas" },
            { text: "Lewisville", href: "#areas" },
            { text: "Coppell", href: "#areas" },
            { text: "Grapevine", href: "#areas" },
          ],
        },
        { text: "Reviews", href: "#testimonials" },
        { text: "FAQ", href: "#faq" },
      ],
      cta: { text: "Request Estimate" },
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
            { text: "Reviews", href: "#testimonials" },
            { text: "FAQ", href: "#faq" },
            { text: "Contact", href: "#contact" },
          ],
        },
        {
          heading: "Services",
          links: [
            { text: "Water Heater Repair", href: "#services" },
            { text: "Sewer Repair", href: "#services" },
            { text: "Gas Leak Detection", href: "#services" },
            { text: "Pipe Leak Repair", href: "#services" },
            { text: "Under Slab Repair", href: "#services" },
            { text: "Emergency Plumbing", href: "#services" },
          ],
        },
        {
          heading: "Service Areas",
          links: [
            { text: "Carrollton, TX", href: "#areas" },
            { text: "The Colony, TX", href: "#areas" },
            { text: "Lewisville, TX", href: "#areas" },
            { text: "Coppell, TX", href: "#areas" },
            { text: "Grapevine, TX", href: "#areas" },
          ],
        },
      ],
    },
    services: {
      cards: [
        {
          image_url: "",
          heading: "Water Heater Repair & Installation",
          paragraph:
            "Tank and tankless water heater repair, replacement, and new installations. Same-day service for emergencies — we'll get your hot water back fast.",
        },
        {
          image_url: "",
          heading: "Sewer & Drain Services",
          paragraph:
            "Camera inspections, hydrostatic testing, sewer line repair, and drain cleaning. We find the problem fast and fix it right the first time.",
        },
        {
          image_url: "",
          heading: "Gas Line & Leak Detection",
          paragraph:
            "Gas line repair, installation, and leak detection by a licensed master plumber. Safety and precision you can trust for your home or business.",
        },
        {
          image_url: "",
          heading: "Under Slab Plumbing Repair",
          paragraph:
            "Expert leak detection and plumbing repair under concrete slabs. We use advanced equipment to locate issues without unnecessary demolition.",
        },
        {
          image_url: "",
          heading: "Pipe Leak Repair",
          paragraph:
            "Fast, reliable pipe leak repair for water lines and supply lines. We stop the damage and get your plumbing back to normal quickly.",
        },
        {
          image_url: "",
          heading: "Emergency Plumbing",
          paragraph:
            "Burst pipes, flooding, or no hot water? We respond fast — often within hours. Available weekends and after hours when you need us most.",
        },
      ],
    },
    process: {
      steps: [
        {
          heading: "Call or Request an Estimate",
          paragraph:
            "Give us a call at (972) 210-9033 or fill out the form. We respond fast — often the same day.",
          features: ["Same-day response", "Free phone consultations"],
        },
        {
          heading: "We Diagnose the Problem",
          paragraph:
            "Chad comes out, thoroughly inspects the issue, and explains exactly what needs to be done — no surprises, no upselling.",
          features: ["Clear explanation of the issue", "Upfront, honest pricing"],
        },
        {
          heading: "Fast, Professional Repair",
          paragraph:
            "We fix it right the first time with quality materials and 24 years of master plumber experience. Your satisfaction is guaranteed.",
          features: ["Licensed master plumber", "100% satisfaction guarantee"],
        },
      ],
    },
    stats_benefits: {
      cards: [
        { icon_svg: "", heading: "157+", paragraph: "5-Star Reviews" },
        { icon_svg: "", heading: "24+", paragraph: "Years in Business" },
        { icon_svg: "", heading: "5", paragraph: "Cities Served" },
        { icon_svg: "", heading: "100%", paragraph: "Satisfaction Guaranteed" },
      ],
    },
    testimonials: {
      top_row: [
        {
          review:
            "We had a great experience with Chad! Reliable, professional, arrived on time, and clearly explained the issue before starting. Pricing was fair and transparent.",
          name: "J Guidry",
        },
        {
          review:
            "Our hot water heater failed the day before a major ice storm. Chad came out and had us back up and running fast. Can't recommend him highly enough!",
          name: "Marcia Moody",
        },
        {
          review:
            "Chad is not just any plumber — he's a master plumber with 25+ years of experience. Knowledgeable, professional, and informative. Our go-to plumber.",
          name: "Tiffany Sharkey",
        },
        {
          review:
            "Had serious drain blockage over the weekend. Called Monday morning, Chad was at my house within two hours. Explained everything and kept it affordable.",
          name: "Troy Cubberly",
        },
      ],
      bottom_row: [
        {
          review:
            "Fast, reliable, and truly expert service from start to finish. Chad was professional, honest, and incredibly knowledgeable. Top-notch quality work.",
          name: "Chelsea Delzell",
        },
        {
          review:
            "We've used Cole's a number of times over the years for blocked drains, regulators, and water heater issues. Chad is professional and pricing is more than fair.",
          name: "Sandra Ford",
        },
        {
          review:
            "Contacted Cole's Plumbing and a few hours later Chad showed up right on time. He completed the repair and explained exactly what was wrong. Would recommend!",
          name: "Kyle Sertner",
        },
        {
          review:
            "I've used Cole for many years. Every time I've needed him it was an emergency and he always came through. Wouldn't call anyone else.",
          name: "Charlie Jones",
        },
      ],
    },
    faq: {
      items: [
        {
          question: "Do you offer emergency plumbing services?",
          answer:
            "Yes! We respond fast to emergencies — often the same day, including weekends. Whether it's a burst pipe, flooding, or a failed water heater, call us at (972) 210-9033 and we'll get there as quickly as possible.",
        },
        {
          question: "How much do your services cost?",
          answer:
            "We're known for fair, affordable pricing. We provide upfront quotes before starting any work so there are no surprises. Our customers consistently mention our reasonable rates in reviews.",
        },
        {
          question: "Are you licensed and insured?",
          answer:
            "Absolutely. Chad holds a Responsible Master Plumber License (RM-40414) issued by the Texas State Board of Plumbing Examiners. We're fully licensed and insured for your peace of mind.",
        },
        {
          question: "What areas do you serve?",
          answer:
            "We serve Carrollton, The Colony, Lewisville, Coppell, and Grapevine in the North DFW / Denton County area. Call us to confirm if we cover your location.",
        },
        {
          question: "Do you work on commercial plumbing?",
          answer:
            "Yes, we handle commercial plumbing including build-outs, renovations, remodels, and industrial bathroom upgrades. We bring the same quality and reliability to commercial jobs as residential.",
        },
        {
          question: "Can you repair plumbing under a concrete slab?",
          answer:
            "Yes, under-slab plumbing repair is one of our specialties. We use advanced leak detection equipment to locate the issue with minimal disruption to your home.",
        },
      ],
    },
    contact: {
      form: {
        inputs: {
          name: { label: "Name *", placeholder: "Full Name" },
          phone: { label: "Phone *", placeholder: "(000) 000-0000" },
          email: { label: "Email *", placeholder: "email@email.com" },
          address: { label: "Service Address *", placeholder: "123 Main St, Carrollton, TX" },
        },
        textarea: {
          notes: { label: "Describe Your Plumbing Issue", placeholder: "Tell us what's going on with your plumbing..." },
        },
        checkbox_text: "I consent to receive SMS & Emails from Cole's Plumbing regarding their services.",
        submit_button: "Request Estimate",
      },
    },
  },
  navbar_variant: "Full",
  footer_variant: "Full",
  hero_tag: "Carrollton's Trusted Master Plumber",
  hero_heading: "Affordable Plumbing Solutions You Can Count On",
  hero_paragraph:
    "With 24+ years of experience, Cole's Plumbing delivers honest, reliable plumbing service at prices that won't break the bank. Family owned, fully licensed, and ready when you need us.",
  hero_button_1_text: "Request Estimate",
  hero_button_2_text: "Our Services",
  hero_variant: "Full Height, Left Align",
  hero_image: "",
  services_variant: "Three Grid",
  services_tag: "Our Services",
  services_heading: "Expert Plumbing for Every Need",
  services_paragraph:
    "From emergency repairs to full installations, our master plumber brings 24 years of experience to every job — done right, priced fair.",
  services_button: "View All Services",
  process_variant: "Sticky List",
  process_tag: "How It Works",
  process_heading: "Simple, Honest Service from Start to Finish",
  process_paragraph:
    "No runaround, no hidden fees. Here's how working with Cole's Plumbing goes.",
  process_button: "Request Estimate",
  about_tag: "About Us",
  about_heading: "24 Years of Master Plumber Experience",
  about_subheading:
    "Cole's Plumbing is a family-owned business built on honesty, fair pricing, and doing the job right. Chad Cole is a licensed master plumber who personally handles your service — because your home deserves someone who cares.",
  about_button_1: "Request Estimate",
  about_button_2: "Learn More",
  about_image: "",
  stats_benefits_visibility: "Statistics",
  testimonials_tag: "Reviews",
  testimonials_heading: "What Our Customers Say",
  testimonials_paragraph: "4.9 Stars · 157+ Verified Google Reviews",
  faq_variant: "Two Grid",
  faq_tag: "FAQ",
  faq_heading: "Common Questions",
  faq_paragraph:
    "Got questions about our plumbing services? Here are the answers to what customers ask most.",
  cta_tag: "Need a Plumber?",
  cta_heading: "You Work Too Hard to Watch Your Money Go Down the Drain",
  cta_paragraph:
    "Get honest, affordable plumbing from a master plumber with 24 years of experience. Call now or request a free estimate.",
  cta_button_1: "Request Estimate",
  cta_button_2: "Call (972) 210-9033",
  contact_variant: "Two Grid",
  contact_tag: "Contact Us",
  contact_heading: "Get a Fast, Fair Plumbing Estimate",
  contact_paragraph:
    "Fill out the form and we'll get back to you quickly — often the same day. Or call us directly for immediate help.",
  css: {
    brand_1: "#1d4ed8",
    brand_1_text: "#ffffff",
    brand_2: "#f59e0b",
    brand_2_text: "#000000",
    dark_900: "#000007",
    dark_800: "#141414",
    light_100: "#fafbfc",
    light_200: "#ebebeb",
    radius: "rounded",
    theme: "light",
  },
};

// ════════════════════════════════════════════════════════════
// SITEMAP DATA (Package 3 — $3,000)
// ════════════════════════════════════════════════════════════

const SITEMAP_NODES: AISitemapNode[] = [
  // Root
  { id: "home", label: "Home", path: "/", pageType: "home", parentId: null, description: "Main landing page with hero, services, about, testimonials, FAQ, and contact", sections: ["Hero", "Services Overview", "About Preview", "Stats/Benefits", "Testimonials", "FAQ", "CTA", "Contact Form"], seoTitle: "Cole's Plumbing — Affordable Plumbing in Carrollton, TX", seoDescription: "24+ years of master plumber experience. Water heaters, sewer repair, gas lines, and emergency plumbing in Carrollton, The Colony, Lewisville, Coppell & Grapevine." },

  // Static Pages
  { id: "about", label: "About", path: "/about", pageType: "static", parentId: "home", description: "Company story, Chad's background, values, and credentials", sections: ["Hero", "Story", "Master Plumber Credentials", "Values", "Team", "CTA"], seoTitle: "About Cole's Plumbing — Meet Chad Cole, Master Plumber", seoDescription: "Family-owned plumbing with 24+ years experience. Licensed Master Plumber RM-40414. Honest service, fair pricing in North DFW." },
  { id: "contact", label: "Contact", path: "/contact", pageType: "static", parentId: "home", description: "Contact form, phone, address, map, emergency info", sections: ["Hero", "Contact Form", "Map", "Business Info", "Emergency CTA"], seoTitle: "Contact Cole's Plumbing — Request a Free Estimate", seoDescription: "Call (972) 210-9033 or fill out our form for fast plumbing service in Carrollton, TX and surrounding areas." },
  { id: "reviews", label: "Reviews", path: "/reviews", pageType: "static", parentId: "home", description: "Full testimonials page with Google reviews showcase", sections: ["Hero", "Review Stats", "Testimonial Grid", "Google Reviews Widget", "CTA"], seoTitle: "Cole's Plumbing Reviews — 4.9 Stars, 157+ Google Reviews", seoDescription: "See what customers say about Cole's Plumbing. 4.9-star rating with 157+ verified Google reviews. Trusted plumber in North DFW." },
  { id: "gallery", label: "Gallery", path: "/gallery", pageType: "static", parentId: "home", description: "Project gallery with before/after photos", sections: ["Hero", "Project Filter", "Photo Grid", "CTA"], seoTitle: "Plumbing Project Gallery — Cole's Plumbing", seoDescription: "Browse our completed plumbing projects. Water heater installs, sewer repairs, and more in the North DFW area." },
  { id: "faq-page", label: "FAQ", path: "/faq", pageType: "static", parentId: "home", description: "Comprehensive FAQ page", sections: ["Hero", "FAQ Categories", "FAQ Accordion", "CTA"], seoTitle: "Plumbing FAQ — Common Questions | Cole's Plumbing", seoDescription: "Answers to common plumbing questions about pricing, services, emergency repairs, and service areas in North DFW." },
  { id: "resources", label: "Resources", path: "/resources", pageType: "static", parentId: "home", description: "Plumbing tips and resource links", sections: ["Hero", "Resource Cards", "Blog Preview", "CTA"] },
  { id: "commercial", label: "Commercial Plumbing", path: "/commercial", pageType: "static", parentId: "home", description: "Commercial plumbing services overview", sections: ["Hero", "Commercial Services", "Industries Served", "Process", "CTA"], seoTitle: "Commercial Plumbing Services — Cole's Plumbing Carrollton", seoDescription: "Build-outs, renovations, remodels, and industrial plumbing. Licensed master plumber serving North DFW businesses." },
  { id: "emergency", label: "Emergency Plumbing", path: "/emergency", pageType: "static", parentId: "home", description: "Emergency plumbing landing page with fast CTA", sections: ["Hero", "Emergency CTA", "Common Emergencies", "Response Time", "Testimonials", "Contact Form"], seoTitle: "Emergency Plumber Carrollton TX — Same Day Service | Cole's Plumbing", seoDescription: "Burst pipe? Flooding? No hot water? Call (972) 210-9033 for fast emergency plumbing in Carrollton, The Colony, Lewisville, Coppell & Grapevine." },

  // Services Collection
  { id: "services", label: "Services", path: "/services", pageType: "collection", parentId: "home", collectionName: "Services", estimatedItems: 9, description: "All plumbing services overview", sections: ["Hero", "Service Cards Grid", "Why Choose Us", "CTA"], seoTitle: "Plumbing Services — Cole's Plumbing Carrollton TX", seoDescription: "Water heater repair, sewer lines, gas leaks, pipe repair, under slab plumbing, and more. Licensed master plumber serving North DFW." },
  { id: "svc-water-heater", label: "Water Heater Repair & Installation", path: "/services/water-heater", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Service Details", "Tank vs Tankless", "Pricing Info", "Gallery", "FAQ", "CTA"], seoTitle: "Water Heater Repair & Installation — Cole's Plumbing", seoDescription: "Tank and tankless water heater repair, replacement, and installation in Carrollton TX. Same-day emergency service available." },
  { id: "svc-sewer", label: "Sewer Repair & Installation", path: "/services/sewer-repair", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Service Details", "Camera Inspection", "Gallery", "FAQ", "CTA"], seoTitle: "Sewer Repair & Camera Inspection — Cole's Plumbing", seoDescription: "Sewer line repair, installation, and camera inspection in Carrollton TX. Hydrostatic testing and drain cleaning services." },
  { id: "svc-gas", label: "Gas Leak Detection & Repair", path: "/services/gas-leak-detection", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Service Details", "Safety Info", "Signs of Gas Leak", "FAQ", "CTA"], seoTitle: "Gas Leak Detection & Line Repair — Cole's Plumbing", seoDescription: "Licensed gas line repair, installation, and leak detection in Carrollton TX. Master plumber with 24+ years experience." },
  { id: "svc-pipe-leak", label: "Pipe Leak Repair", path: "/services/pipe-leak-repair", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Service Details", "Types of Leaks", "Gallery", "FAQ", "CTA"], seoTitle: "Pipe Leak Repair — Cole's Plumbing Carrollton TX", seoDescription: "Fast, reliable pipe leak repair for residential and commercial properties. Water line and supply line repairs in North DFW." },
  { id: "svc-under-slab", label: "Under Slab Plumbing Repair", path: "/services/under-slab-repair", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Service Details", "Detection Process", "Gallery", "FAQ", "CTA"], seoTitle: "Under Slab Plumbing Repair — Cole's Plumbing", seoDescription: "Expert leak detection and plumbing repair under concrete slabs in Carrollton TX. Advanced equipment, minimal disruption." },
  { id: "svc-water-line", label: "Water Line Repair & Installation", path: "/services/water-line-repair", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Service Details", "Gallery", "FAQ", "CTA"], seoTitle: "Water Line Repair & Installation — Cole's Plumbing", seoDescription: "Water line repair, replacement, and installation in Carrollton TX. Licensed master plumber, fair pricing." },
  { id: "svc-drain", label: "Drain Cleaning", path: "/services/drain-cleaning", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Service Details", "Common Causes", "Prevention Tips", "FAQ", "CTA"], seoTitle: "Drain Cleaning & Unclogging — Cole's Plumbing", seoDescription: "Professional drain cleaning services in Carrollton TX. Kitchen, bathroom, and main line drain clearing. Same-day service." },
  { id: "svc-faucet", label: "Faucet Repair & Installation", path: "/services/faucet-repair", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Service Details", "Gallery", "FAQ", "CTA"], seoTitle: "Faucet Repair & Installation — Cole's Plumbing", seoDescription: "Kitchen and bathroom faucet repair and installation in Carrollton TX. Quality fixtures, expert installation." },
  { id: "svc-remodel", label: "Kitchen & Bathroom Remodels", path: "/services/remodels", pageType: "collection_item", parentId: "services", collectionName: "Services", sections: ["Hero", "Service Details", "Before/After Gallery", "Process", "FAQ", "CTA"], seoTitle: "Kitchen & Bathroom Plumbing Remodels — Cole's Plumbing", seoDescription: "Expert plumbing for kitchen and bathroom remodels in Carrollton TX. Fixtures, pipes, and plumbing layout by a master plumber." },

  // Service Areas Collection
  { id: "areas", label: "Service Areas", path: "/areas", pageType: "collection", parentId: "home", collectionName: "Service Areas", estimatedItems: 5, description: "Service area pages for local SEO", sections: ["Hero", "Area Grid", "Map", "CTA"], seoTitle: "Plumbing Service Areas — North DFW | Cole's Plumbing", seoDescription: "Cole's Plumbing serves Carrollton, The Colony, Lewisville, Coppell, and Grapevine TX. Licensed master plumber near you." },
  { id: "area-carrollton", label: "Carrollton, TX", path: "/areas/carrollton", pageType: "collection_item", parentId: "areas", collectionName: "Service Areas", sections: ["Hero", "Services in Area", "About Carrollton", "Testimonials", "FAQ", "CTA"], seoTitle: "Plumber in Carrollton TX — Cole's Plumbing", seoDescription: "Affordable plumbing in Carrollton TX. Water heaters, sewer repair, gas lines, and emergency plumbing. Call (972) 210-9033." },
  { id: "area-colony", label: "The Colony, TX", path: "/areas/the-colony", pageType: "collection_item", parentId: "areas", collectionName: "Service Areas", sections: ["Hero", "Services in Area", "About The Colony", "Testimonials", "FAQ", "CTA"], seoTitle: "Plumber in The Colony TX — Cole's Plumbing", seoDescription: "Trusted plumbing in The Colony TX. 24+ years experience, fair pricing, same-day emergency service. Call (972) 210-9033." },
  { id: "area-lewisville", label: "Lewisville, TX", path: "/areas/lewisville", pageType: "collection_item", parentId: "areas", collectionName: "Service Areas", sections: ["Hero", "Services in Area", "About Lewisville", "Testimonials", "FAQ", "CTA"], seoTitle: "Plumber in Lewisville TX — Cole's Plumbing", seoDescription: "Reliable plumbing services in Lewisville TX. Licensed master plumber, emergency repairs, affordable pricing." },
  { id: "area-coppell", label: "Coppell, TX", path: "/areas/coppell", pageType: "collection_item", parentId: "areas", collectionName: "Service Areas", sections: ["Hero", "Services in Area", "About Coppell", "Testimonials", "FAQ", "CTA"], seoTitle: "Plumber in Coppell TX — Cole's Plumbing", seoDescription: "Expert plumbing in Coppell TX. Water heaters, sewer lines, gas leaks, and more. Family-owned, 24+ years experience." },
  { id: "area-grapevine", label: "Grapevine, TX", path: "/areas/grapevine", pageType: "collection_item", parentId: "areas", collectionName: "Service Areas", sections: ["Hero", "Services in Area", "About Grapevine", "Testimonials", "FAQ", "CTA"], seoTitle: "Plumber in Grapevine TX — Cole's Plumbing", seoDescription: "Professional plumbing in Grapevine TX. Residential and commercial service. Licensed, insured, fair pricing." },

  // Blog Collection
  { id: "blog", label: "Blog", path: "/blog", pageType: "collection", parentId: "home", collectionName: "Blog Posts", estimatedItems: 10, description: "Plumbing tips, guides, and news", sections: ["Hero", "Post Grid", "Categories", "CTA"], seoTitle: "Plumbing Blog — Tips & Guides | Cole's Plumbing", seoDescription: "Plumbing tips, maintenance guides, and expert advice from a master plumber with 24+ years experience." },
  { id: "blog-1", label: "Signs You Need a Water Heater Replacement", path: "/blog/signs-water-heater-replacement", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related Services", "CTA"] },
  { id: "blog-2", label: "How to Prevent Frozen Pipes in Texas", path: "/blog/prevent-frozen-pipes-texas", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related Services", "CTA"] },
  { id: "blog-3", label: "What to Do in a Plumbing Emergency", path: "/blog/plumbing-emergency-guide", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related Services", "CTA"] },
  { id: "blog-4", label: "Tank vs Tankless Water Heaters", path: "/blog/tank-vs-tankless-water-heaters", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related Services", "CTA"] },
  { id: "blog-5", label: "Signs of a Gas Leak in Your Home", path: "/blog/signs-gas-leak-home", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related Services", "CTA"] },
  { id: "blog-6", label: "How to Choose a Reliable Plumber", path: "/blog/how-to-choose-reliable-plumber", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related Services", "CTA"] },
  { id: "blog-7", label: "5 Common Plumbing Problems in Older Homes", path: "/blog/common-plumbing-problems-older-homes", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related Services", "CTA"] },
  { id: "blog-8", label: "Under Slab Leaks: What Homeowners Need to Know", path: "/blog/under-slab-leaks-guide", pageType: "collection_item", parentId: "blog", collectionName: "Blog Posts", sections: ["Hero", "Content", "Related Services", "CTA"] },

  // Gallery Collection
  { id: "projects", label: "Projects", path: "/projects", pageType: "collection", parentId: "home", collectionName: "Projects", estimatedItems: 8, description: "Before/after project showcase", sections: ["Hero", "Project Filter", "Project Grid"] },
  { id: "proj-1", label: "Water Heater Install", path: "/projects/water-heater-install", pageType: "collection_item", parentId: "projects", collectionName: "Projects", sections: ["Hero", "Before/After", "Details", "CTA"] },
  { id: "proj-2", label: "Slab Leak Repair", path: "/projects/slab-leak-repair", pageType: "collection_item", parentId: "projects", collectionName: "Projects", sections: ["Hero", "Before/After", "Details", "CTA"] },
  { id: "proj-3", label: "Kitchen Remodel Plumbing", path: "/projects/kitchen-remodel", pageType: "collection_item", parentId: "projects", collectionName: "Projects", sections: ["Hero", "Before/After", "Details", "CTA"] },

  // Utility
  { id: "privacy", label: "Privacy Policy", path: "/legal/privacy-policy", pageType: "utility", parentId: "home", description: "Privacy policy page" },
  { id: "terms", label: "Terms of Service", path: "/legal/terms", pageType: "utility", parentId: "home", description: "Terms of service page" },
];

// ════════════════════════════════════════════════════════════
// SEED ROUTE
// ════════════════════════════════════════════════════════════

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Create client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      first_name: "Chad",
      last_name: "Cole",
      business_name: "Cole's Plumbing",
      email: "",
      phone: "(972) 210-9033",
      status: "active",
    })
    .select()
    .single();

  if (clientError || !client) {
    return NextResponse.json(
      { error: `Failed to create client: ${clientError?.message}` },
      { status: 500 }
    );
  }

  const clientId = client.id;

  // 2. Create knowledge entries
  await supabase.from("client_knowledge_entries").insert([
    {
      client_id: clientId,
      type: "website_scrape",
      title: "Cole's Plumbing Website Copy",
      content: "Business: Cole's Plumbing Dallas. Address: 1325 Whitlock Lane Suite 309 Carrollton, TX 75006. Phone: (972) 210-9033. Master Plumber License: RM-40414. 24 years in business, family owned. Services: Water heater repair/install, water line repair, gas leak detection, sewer repair, pipe leaks, under slab repair, drain cleaning, faucet repair, kitchen/bathroom remodels, commercial plumbing. Service Areas: The Colony, Lewisville, Carrollton, Coppell, Grapevine. Tagline: You work too hard to watch your money go down the drain.",
    },
    {
      client_id: clientId,
      type: "meeting_notes",
      title: "Google Reviews Summary (4.9 stars, 157+ reviews)",
      content: "Cole's Plumbing has 4.9/5 stars with 157+ Google reviews. Key themes: fast response (same-day, often within hours), fair/affordable pricing, professional and honest, Chad personally handles most jobs, excellent communication, emergency availability including weekends. Notable reviews praise emergency response, tankless water heater installs, under-slab leak repairs, drain cleaning, and gas line work.",
    },
    {
      client_id: clientId,
      type: "meeting_notes",
      title: "Client Notes — Service Area & Package",
      content: "Client relocated to Carrollton. Wants to keep service areas smaller — just Carrollton, The Colony, Lewisville, Coppell, and Grapevine. Package 3 ($3,000) — Advanced package with SEO-focused pages, blog, service areas, project gallery.",
    },
  ]);

  // 3. Create compiled knowledge document
  await supabase.from("client_knowledge_documents").upsert(
    {
      client_id: clientId,
      content: COMPILED_KB,
      last_compiled_at: new Date().toISOString(),
      entry_ids_included: [],
      metadata: { model: "manual-seed", entry_count: 3 },
    },
    { onConflict: "client_id" }
  );

  // 4. Create mockup config
  const { error: mockupError } = await supabase
    .from("client_mockups")
    .upsert(
      {
        client_id: clientId,
        webflow_item_id: "",
        webflow_url: "",
        config: MOCKUP_CONFIG,
        logo_url: "",
        status: "draft",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    );

  if (mockupError) {
    return NextResponse.json(
      { error: `Failed to create mockup: ${mockupError.message}` },
      { status: 500 }
    );
  }

  // 5. Create sitemap
  const nodes = aiNodesToSitemapNodes(SITEMAP_NODES);
  const edges = buildEdgesFromParentIds(SITEMAP_NODES);
  const laidOut = autoLayout(nodes, edges);

  const slug = generateSlug("coles-plumbing");

  const { error: sitemapError } = await supabase
    .from("client_sitemaps")
    .upsert(
      {
        client_id: clientId,
        slug,
        title: "Cole's Plumbing — Site Map",
        package_tier: 3,
        sitemap_data: {
          nodes: laidOut,
          edges,
          viewport: { x: 0, y: 0, zoom: 0.75 },
        },
        is_public: true,
        allow_comments: true,
        status: "draft",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    );

  if (sitemapError) {
    return NextResponse.json(
      { error: `Failed to create sitemap: ${sitemapError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    client_id: clientId,
    client_name: "Chad Cole — Cole's Plumbing",
    sitemap_slug: slug,
    created: {
      client: true,
      knowledge_entries: 3,
      compiled_kb: true,
      mockup: true,
      sitemap: `${SITEMAP_NODES.length} pages (Package 3)`,
    },
  });
}
