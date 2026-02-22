# Client Onboarding Config Generator

You are generating a JSON configuration for a client onboarding form. Analyze the client's website and business to create personalized questions.

## Instructions

1. Visit the client's website and note: colors, logo, services, contact info, location, industry
2. Generate a JSON config following the schema below
3. Make questions conversational and friendly (like Typeform)
4. Pre-fill detected values where possible (colors, phone, services)
5. Keep it to 8-15 questions. Enough to gather what we need, not so many it feels tedious.

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
  "description": "This helps us write your site copy. Don't overthink it, just tell us what you do!",
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
  "description": "PNG or SVG preferred. If you don't have one, no worries, we can work with that.",
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

### yes_no_na
Yes/No with a "Not Applicable" option. Shows three buttons. Yes and No show an optional details input, while N/A auto-advances to the next question.
```json
{
  "id": "has_insurance",
  "type": "yes_no_na",
  "question": "Do you carry liability insurance?",
  "detailsPrompt": "What's your policy provider?",
  "required": true
}
```

### brand_colors
Advanced color selection with theme picker (light/dark), detected colors as toggleable chips, and a custom color picker. Use INSTEAD of color_confirm when you want theme selection alongside color choices.
```json
{
  "id": "brand_identity",
  "type": "brand_colors",
  "question": "Let's nail down your brand colors and style.",
  "detectedColors": [
    { "hex": "#1E40AF", "label": "Primary Blue", "source": "header" },
    { "hex": "#F59E0B", "label": "Accent Gold", "source": "buttons" }
  ],
  "detectedTheme": "dark",
  "required": true
}
```

### tag_input
Freeform tag/chip input with optional suggestions and min/max limits. Tags are typed and comma-separated, or clicked from suggestions.
```json
{
  "id": "service_areas",
  "type": "tag_input",
  "question": "What areas do you serve?",
  "suggestions": ["Downtown", "Midtown", "Suburbs", "Metro Area"],
  "minTags": 1,
  "maxTags": 10,
  "placeholder": "Type an area and press Enter...",
  "required": true
}
```

### team_members
Add team members with name, short bio (150 char max), and optional photo upload.
```json
{
  "id": "team",
  "type": "team_members",
  "question": "Who's on your team?",
  "description": "Add the people you'd like featured on your site.",
  "required": false
}
```

### project_gallery
Two modes: Before & After (named projects with before/after photo pairs) or Photo Gallery (simple grid, up to 20 photos). User toggles between modes.
```json
{
  "id": "past_work",
  "type": "project_gallery",
  "question": "Got photos of your work?",
  "description": "Show off completed projects or upload a gallery of your best shots.",
  "required": false
}
```

## Conditional Questions (showIf)

Questions can be conditionally shown based on previous answers using the `showIf` property. The question only appears when the condition is met.

```json
{
  "id": "google_reviews_link",
  "type": "text",
  "question": "Drop your Google reviews link here.",
  "description": "We'll pull in your best reviews to feature on the site.",
  "placeholder": "https://g.page/your-business/review",
  "showIf": { "questionId": "has_reviews", "equals": true },
  "required": false
}
```

### How showIf works
- `questionId`: The `id` of the question whose answer to check
- `equals`: The value to compare against:
  - `true` / `false` for yes_no questions
  - `"yes"` / `"no"` / `"na"` for yes_no_na questions
  - A string value for select questions
  - A string value for multi_select (checks if the value is included)

### When to use showIf
- Follow-up questions that only make sense if a previous answer is a certain value
- The most common pattern: a yes_no question followed by a details question shown only on "yes"
- Example: "Do you have Google reviews?" (yes_no) followed by "Drop your link" (text, showIf equals true)
- Example: "Do you offer emergency service?" (yes_no) followed by "What's your emergency line?" (text, showIf equals true)

### Rules for showIf
- The referenced `questionId` MUST appear BEFORE the conditional question in the questions array
- Hidden questions are automatically skipped in the form
- Keep conditional chains short. One level deep is ideal, avoid chaining conditionals.

## Example: Full Config for a Plumber

```json
{
  "client_slug": "chad-plumbing",
  "client_name": "Chad",
  "business_name": "Chad's Plumbing",
  "config": {
    "welcome": {
      "title": "Hey Chad! Let's get your new site dialed in.",
      "subtitle": "Just a few quick questions. Should take about 5 minutes."
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
        "id": "google_reviews_link",
        "type": "text",
        "question": "Drop your Google reviews link here.",
        "description": "We'll pull in your best reviews to feature on the site. You can find this by searching your business on Google Maps and copying the URL.",
        "placeholder": "https://g.page/your-business/review",
        "showIf": { "questionId": "has_reviews", "equals": true },
        "required": false
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
        "id": "words_to_avoid",
        "type": "tag_input",
        "question": "Any words or phrases we should absolutely NOT use on your site?",
        "description": "Some words just don't fit your brand or rub customers the wrong way. Let us know so we can steer clear.",
        "suggestions": ["Cheap", "Budget", "Discount", "Quick fix"],
        "maxTags": 20,
        "placeholder": "Type a word or phrase and press Enter...",
        "required": false
      },
      {
        "id": "anything_else",
        "type": "textarea",
        "question": "Anything else we should know?",
        "description": "Special promotions, certifications, years in business, anything that sets you apart.",
        "required": false
      }
    ]
  }
}
```

## Guidelines for the AI

- Use the client's first name in welcome/completion messages
- Pre-populate detected values (colors from their site, services found, phone number) but ONLY if the data was actually found in the scraped data. If a value shows "N/A" in the scraped data, do NOT make one up or guess. Leave the field empty or ask the client for it instead.
- NEVER fabricate contact info (emails, phones, addresses). Only use what was actually scraped from the site. If no email was found, do not invent one.
- Start with visual questions (colors, logo) to keep it engaging
- Put the most important questions first
- Keep questions conversational. Avoid corporate/legal language.
- Use description fields to explain WHY you're asking
- Make file uploads optional unless critical
- **ALWAYS include a "words_to_avoid" question** (tag_input type) near the end of the form, right before the "anything else" question. This is critical — clients often have strong opinions about language that doesn't fit their brand. Tailor the suggestions to the industry (e.g. a luxury brand might want to avoid "cheap/budget", a medical practice might want to avoid "pain/hurt").
- End with an open-ended "anything else" question
- The client_slug must be URL-safe: lowercase, hyphens only, no special characters
- Use showIf for follow-up questions that depend on previous answers. The most common pattern: yes_no followed by a conditional text question for details.
