# Client Onboarding Config Generator

You are generating a JSON configuration for a client onboarding form. Analyze the client's website and business to create personalized questions.

## Instructions

1. Visit the client's website and note: colors, logo, services, contact info, location, industry
2. Generate a JSON config following the schema below
3. Make questions conversational and friendly (like Typeform)
4. Pre-fill detected values where possible (colors, phone, services)
5. Keep it to 8-15 questions — enough to gather what we need, not so many it feels tedious

## JSON Schema

```json
{
  "client_slug": "kebab-case-business-name",
  "client_name": "First name or friendly name",
  "business_name": "Full Business Name",
  "config": {
    "welcome": {
      "title": "Hey [Name]! Let's get your new site set up.",
      "subtitle": "This should only take about 5 minutes."
    },
    "completion": {
      "title": "You're all set!",
      "message": "We've got everything we need. We'll be in touch soon with next steps."
    },
    "questions": [
      // Array of question objects (see types below)
    ]
  }
}
```

## Question Types

### text
Short answer input. Use for names, phone numbers, single-line answers.
```json
{
  "id": "phone",
  "type": "text",
  "question": "What's the best phone number to reach you?",
  "description": "We'll use this for your site's contact section.",
  "placeholder": "(555) 123-4567",
  "required": true
}
```

### textarea
Long answer input. Use for descriptions, bios, detailed answers.
```json
{
  "id": "business_description",
  "type": "textarea",
  "question": "How would you describe your business in a few sentences?",
  "description": "This helps us write your site copy. Don't overthink it — just tell us what you do!",
  "placeholder": "We specialize in...",
  "maxLength": 500,
  "required": true
}
```

### select
Single choice from options. Shows as large clickable cards.
```json
{
  "id": "site_style",
  "type": "select",
  "question": "What vibe are you going for with your website?",
  "options": [
    { "label": "Clean & Professional", "value": "professional" },
    { "label": "Bold & Modern", "value": "modern" },
    { "label": "Warm & Friendly", "value": "friendly" },
    { "label": "Luxury & Premium", "value": "luxury" }
  ],
  "required": true
}
```

### multi_select
Multiple choice. Use when they can pick more than one.
```json
{
  "id": "services",
  "type": "multi_select",
  "question": "Which services should we feature on your site?",
  "description": "Pick all that apply.",
  "options": [
    { "label": "Drain Cleaning", "value": "drain_cleaning" },
    { "label": "Water Heater Repair", "value": "water_heater" },
    { "label": "Pipe Installation", "value": "pipe_install" }
  ],
  "allowOther": true,
  "required": true
}
```

### yes_no
Simple yes/no toggle. Shows two large buttons.
```json
{
  "id": "has_reviews",
  "type": "yes_no",
  "question": "Do you have Google reviews you'd like us to showcase?",
  "required": true
}
```

### file_upload
File upload with drag-and-drop.
```json
{
  "id": "logo",
  "type": "file_upload",
  "question": "Got a logo? Upload it here.",
  "description": "PNG or SVG preferred. If you don't have one, no worries — we can work with that.",
  "maxFiles": 3,
  "acceptedTypes": ["image/png", "image/svg+xml", "image/jpeg"],
  "required": false
}
```

### color_picker
Lets them pick a color. Use when you need a new color choice.
```json
{
  "id": "accent_color",
  "type": "color_picker",
  "question": "Pick an accent color you like.",
  "description": "This will be used for buttons and highlights.",
  "required": false
}
```

### color_confirm
Shows detected colors from their current site. They can keep or change each one.
```json
{
  "id": "brand_colors",
  "type": "color_confirm",
  "question": "We found these colors on your current site. Keep them or change them up?",
  "detectedColors": [
    { "hex": "#1E40AF", "label": "Primary Blue", "source": "header background" },
    { "hex": "#FFFFFF", "label": "Background White", "source": "page background" },
    { "hex": "#F59E0B", "label": "Accent Gold", "source": "CTA buttons" }
  ],
  "required": true
}
```

### address
Structured address input (street, city, state, zip).
```json
{
  "id": "business_address",
  "type": "address",
  "question": "What's your business address?",
  "description": "We'll add this to your contact page and Google Maps embed.",
  "required": true
}
```

## Example: Full Config for a Plumber

```json
{
  "client_slug": "chad-plumbing",
  "client_name": "Chad",
  "business_name": "Chad's Plumbing",
  "config": {
    "welcome": {
      "title": "Hey Chad! Let's get your new site dialed in.",
      "subtitle": "Just a few quick questions — should take about 5 minutes."
    },
    "completion": {
      "title": "That's a wrap!",
      "message": "Thanks Chad! We've got everything we need to start building. We'll be in touch within 24 hours with a preview."
    },
    "questions": [
      {
        "id": "brand_colors",
        "type": "color_confirm",
        "question": "We spotted these colors on your current site. Want to keep them?",
        "detectedColors": [
          { "hex": "#1E40AF", "label": "Primary Blue", "source": "header" },
          { "hex": "#FFFFFF", "label": "White", "source": "background" }
        ],
        "required": true
      },
      {
        "id": "logo",
        "type": "file_upload",
        "question": "Got a logo you'd like us to use?",
        "description": "Upload any format. If you don't have one, just skip this.",
        "maxFiles": 3,
        "acceptedTypes": ["image/png", "image/svg+xml", "image/jpeg", "application/pdf"],
        "required": false
      },
      {
        "id": "business_description",
        "type": "textarea",
        "question": "How would you describe Chad's Plumbing to a new customer?",
        "placeholder": "We're a family-owned plumbing company that...",
        "maxLength": 500,
        "required": true
      },
      {
        "id": "services",
        "type": "multi_select",
        "question": "Which services should we highlight on your site?",
        "description": "We found these on your current site. Add or remove as needed.",
        "options": [
          { "label": "Drain Cleaning", "value": "drain_cleaning" },
          { "label": "Water Heater Repair", "value": "water_heater" },
          { "label": "Emergency Plumbing", "value": "emergency" },
          { "label": "Pipe Installation", "value": "pipe_install" },
          { "label": "Bathroom Remodeling", "value": "bathroom_remodel" }
        ],
        "allowOther": true,
        "required": true
      },
      {
        "id": "service_area",
        "type": "text",
        "question": "What areas do you serve?",
        "placeholder": "e.g. Dallas-Fort Worth metro area",
        "required": true
      },
      {
        "id": "phone",
        "type": "text",
        "question": "Best phone number for the site?",
        "description": "This is what customers will see and call.",
        "placeholder": "(555) 123-4567",
        "required": true
      },
      {
        "id": "business_address",
        "type": "address",
        "question": "What's your business address?",
        "description": "For your contact page and Google Maps.",
        "required": true
      },
      {
        "id": "site_style",
        "type": "select",
        "question": "What vibe should your website have?",
        "options": [
          { "label": "Clean & Professional", "value": "professional" },
          { "label": "Bold & Modern", "value": "modern" },
          { "label": "Warm & Friendly", "value": "friendly" }
        ],
        "required": true
      },
      {
        "id": "has_reviews",
        "type": "yes_no",
        "question": "Do you have Google reviews we can feature?",
        "description": "Social proof is huge for local businesses.",
        "required": true
      },
      {
        "id": "photos",
        "type": "file_upload",
        "question": "Got any photos of your work, team, or trucks?",
        "description": "Real photos perform way better than stock images. Upload as many as you'd like.",
        "maxFiles": 10,
        "acceptedTypes": ["image/png", "image/jpeg", "image/webp"],
        "required": false
      },
      {
        "id": "anything_else",
        "type": "textarea",
        "question": "Anything else we should know?",
        "description": "Special promotions, certifications, years in business — anything that sets you apart.",
        "required": false
      }
    ]
  }
}
```

## Guidelines for the AI

- Use the client's first name in welcome/completion messages
- Pre-populate detected values (colors from their site, services found, phone number)
- Start with visual questions (colors, logo) to keep it engaging
- Put the most important questions first
- Keep questions conversational — avoid corporate/legal language
- Use description fields to explain WHY you're asking
- Make file uploads optional unless critical
- End with an open-ended "anything else" question
- The client_slug must be URL-safe: lowercase, hyphens only, no special characters
