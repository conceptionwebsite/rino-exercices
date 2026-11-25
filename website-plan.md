# Larkline Estates · Website plan (Prototype v2)

Client: Larkline Estates, small independent estate agency in Quimper (Finistère). Brief: `larkline-call-transcript-quimper.pdf`, `larkline-estates-overview-quimper.pdf`.

## Design direction

Calm and editorial, like a good hotel website: you want to keep scrolling, nothing shouts. Warm off-white backgrounds taken from Breton granite, deep warm charcoal for contrast sections, and the logo orange kept as the only accent. Headings in Fraunces with its soft, slightly playful letterforms (v2: friendlier than the v1 Newsreader), body text in Figtree. Real street-level photos of Quimper instead of a postcard skyline, and real people (agents) on every listing. The site sells personal service first and homes second: sellers are the priority, buyers get a direct line to one agent.

Inspiration taken from the reference screenshot (dark sections, rounded cards, overlay badges, mosaic gallery, form in a card), without copying its layout or its coloured words in headings.

## Sitemap

| Page | Template? | Why |
| --- | --- | --- |
| Home | No | The confirmation page: who Larkline is, how they sell, the valuation request, homes, neighborhoods, team. Most visitors arrive from social media or word of mouth. |
| Property (single) | Yes | One design for every listing. Each listing belongs to one agent and shows how to reach them now (WhatsApp, call). |
| Homes for sale (archive) | Yes, built in v2 | Filterable list of all listings, by neighborhood and type. Linked from the home page. |
| Journal post (single) + archive | Yes, built in v2 | The three articles from the brief, more over time. |
| Valuation confirmation | Built in v2 | Today handled inline in the form. A real page helps tracking (analytics goal). |
| Team | Section, not a page | The brief asks for a team page; v1 keeps it as a home section. Can become a page with one card per agent if Claire wants more detail. |
| Legal notice, privacy | Built in v2 as templates to complete | Required in France (mentions légales, carte professionnelle, RGPD). |

## Home page structure

1. Header over the hero: logo, five links, one button (Free valuation).
2. Hero: street-level photo of central Quimper, the promise, one main button (Plan a free valuation), a low-key text link for buyers.
3. Small on purpose: the office photo, Claire's story in two sentences, three honest numbers.
4. How we sell (dark): four steps from valuation visit to the notary.
5. Valuation request: two-step form (home, then you), what happens next, recently sold proof right next to it.
6. Homes for sale: six cards, each with its agent; swipe row on phones.
7. Neighborhood guide: tabs per neighborhood with a street photo, who it suits and the local agent.
8. Team: four agents with direct call and WhatsApp.
9. Claire's words (dark): her own sentence from the call, with a photo of the Odet.
10. Journal: the three articles from the brief.
11. Closing band: repeat of the main call to action.
12. Footer: office, contact, links, legal placeholders.

## Property page structure

1. Solid header.
2. Breadcrumb, status, title, price.
3. Photo mosaic (swipe gallery on phones).
4. Key facts bar (type, m², bedrooms, bathrooms, energy rating).
5. Description, features, energy performance (DPE) and practical details, with a sticky agent card: WhatsApp (main), call, email.
6. Living in the neighborhood: photo and walking times.
7. More homes from the same agent, plus a seller prompt.
8. Footer. On phones a fixed bar keeps WhatsApp and Call one tap away.

## Open points for the client

- Real photos of the team, the office in Quimper and each listing (v1 uses Unsplash placeholders).
- The office photo provided shows a city-block view through the windows; a photo of the Quimper office would fit better.
- Carte professionnelle number, legal notice, privacy policy.
- Real client reviews to place next to the valuation form (none were invented).
- Backend for the valuation requests: each request needs a status and an owner (see transcript).

## Version 2 changes

- Solid buttons use a lighter orange (brand-3, #F5A866) with dark text: 8.8:1 contrast.
- Heading font: Fraunces (soft, slightly wonky) replaces Newsreader.
- Home, Journal: bleed slider that starts on the content edge and runs off the right of the screen (scroll-snap, mouse drag with inertia, arrow buttons).
- Home, Claire's words: live WebGL background of slowly turning concentric house gables, the shape of the logo, in palette colours only. Pushes away from the mouse, wanders on its own on touch screens, 30fps cap, pauses off screen, CSS gradient fallback, still frame with reduced motion.
- All pages: curtain footer. The page lifts off a fixed footer with a light parallax; becomes a normal footer when it is taller than the screen.
- New pages: homes.html, journal.html, journal-locmaria-or-moulin-vert.html, valuation-thanks.html, legal-notice.html, privacy.html. The valuation form now leads to the confirmation page, which names the agent for the chosen neighborhood.
- Scripts moved to js/site.js, shared by all pages.
