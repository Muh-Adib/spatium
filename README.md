# UNIMASI — Animation & Motion Design Studio

A premium, interactive studio website for **UNIMASI**, covering 2D Animation, 3D Animation &
Visual Production, and Motion Graphics.

> **Note on source material.** No brand reference file or existing site content was supplied with
> this build, so the visual system was designed from the written brief (navy / vibrant yellow /
> white, bold modern typography, cinematic composition) and all copy, artwork and articles are
> original. Nothing has been migrated, and no legacy URLs are claimed. If you share the brand
> reference or existing content, the tokens in `src/styles/tokens.css` and the data files in
> `src/data/` are the only places that need to change.

---

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Build | Vite 5 | Fast dev server, static output, no server runtime required |
| UI | React 18 + TypeScript (strict) | Reusable components, typed content model |
| Routing | React Router 6 | Client routing for every required page |
| Styling | Plain CSS with custom-property tokens, co-located per component | No framework overhead, easy to theme, small bundle |
| Imagery | 100% inline SVG generated in-house | Nothing external to 404, no licensing questions |
| Fonts | Google Fonts (`Space Grotesk`, `Inter`, `JetBrains Mono`) with full system fallbacks | Graceful degradation if the CDN is unavailable |

No CSS framework, no animation library, no image CDN. Motion is CSS plus a small
IntersectionObserver hook.

---

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm run verify     # type-check + render smoke test across all routes
```

### Dev server and preview networking

The dev server binds `0.0.0.0:3000`. Vite 5.4 answers only hosts it recognises, so the preview
hostname is listed in `allowedHosts` in `vite.config.ts`. If the VM hostname changes, either edit
that list or start with:

```bash
VITE_ALLOWED_HOSTS=new-host.example.com npm run dev
```

`allowedHosts` is never set to `true` and no wildcard domain is allowed.

---

## Project structure

```
src/
├── App.tsx                    # Route table
├── main.tsx                   # Entry point
├── components/
│   ├── Icon.tsx               # 50+ named stroke icons
│   ├── Seo.tsx                # Per-route title/description/canonical/OG + JSON-LD
│   ├── art/StudioArt.tsx      # Generative SVG artwork (13 motifs)
│   ├── forms/InquiryForm.tsx  # Validated inquiry form
│   ├── home/                  # Homepage sections
│   ├── journal/ArticleCard.tsx
│   ├── layout/                # Header, Footer, Layout, scroll progress
│   ├── portfolio/ProjectCard.tsx
│   ├── services/ServiceVisual.tsx   # The interactive 2D / 3D / motion experiences
│   └── ui/                    # Reveal, SectionHead, PageHero, Breadcrumbs, CTASection
├── data/                      # All copy and content (site, services, projects, articles)
├── hooks/index.ts             # Scroll reveal, pointer parallax, scroll lock, anchor tracking
├── pages/                     # One file per route
└── styles/                    # tokens.css + globals.css
```

Content lives in `src/data/` — services, projects, articles, process, industries, values. Editing
copy never requires touching a component.

---

## Pages

| Route | File |
| --- | --- |
| `/` | `pages/Home.tsx` |
| `/services` | `pages/Services.tsx` |
| `/services/:slug` (`2d-animation`, `3d-animation`, `motion-graphics`, `digital-assets-ai`) | `pages/ServiceDetail.tsx` |
| `/portfolio` (supports `?category=`) | `pages/Portfolio.tsx` |
| `/portfolio/:slug` | `pages/ProjectDetail.tsx` |
| `/about` | `pages/About.tsx` |
| `/journal` (supports `?category=`) | `pages/Journal.tsx` |
| `/journal/:slug` | `pages/ArticleDetail.tsx` |
| `/contact` | `pages/Contact.tsx` |
| anything else | `pages/NotFound.tsx` |

---

## Interactions worth trying

- **Hero** — a rotating 3D composition with floating storyboard frames, preview panels and
  timeline chips. Elements parallax at different depths as the pointer moves, the stage scales on
  scroll, and the whole thing collapses to a calmer layout under `prefers-reduced-motion`.
- **2D Animation** — sketch-to-final slider (drag, arrow keys, or "Auto preview").
- **3D Animation** — wireframe-to-render slider **plus** a drag-to-orbit model with camera presets
  (perspective / front / top) and a render-vs-wireframe toggle.
- **Motion Graphics** — animated kinetic-type marquee and a chart with bars / line / donut modes
  and replay.
- **Portfolio & Journal** — live filtering, synced to the URL so filtered views are linkable.
- **Process** — five-stage timeline with a detail panel, keyboard arrow navigation and progress line.
- **Navigation** — desktop dropdown, full-screen mobile menu with accordion, Escape to close,
  scroll progress bar, sticky header state.

---

## The inquiry form: what it actually does

Fields: name, company, email, service interest, budget range, timeline and project brief — validated
inline with accessible error messaging, `aria-invalid`, focus-on-first-error and a hidden honeypot.

Submission behaviour is explicit rather than simulated:

- **With `VITE_INQUIRY_ENDPOINT` set** — the form POSTs JSON to that endpoint and reports the real
  result (including HTTP failures).
- **Without it** — nothing is transmitted. The form compiles the brief into a pre-filled email
  draft and shows it, with a one-click "Send by email" link and a copy-to-clipboard button. The UI
  states this plainly so no one believes an unconfigured form sent anything.

Set the endpoint in `.env.local` (see `.env.example`).

---

## Swapping in real assets

1. **Project artwork** — `StudioArt` renders one of 13 original SVG motifs via `variant`. To use a
   real still, add a `posterUrl` to the project in `src/data/projects.ts`.
2. **Project video** — add `videoUrl` (and optionally `posterUrl`); `ProjectDetail` renders a
   `<video>` player in place of the placeholder and everything else stays the same.
3. **Portfolio content** — every entry in `src/data/projects.ts` is an illustrative capability
   study. No client, award or performance result is claimed anywhere. Replace the entries with
   verified project detail before launch, and remove the explanatory note at the top of the
   portfolio page once real work is in place.
4. **Articles** — `src/data/articles.ts` holds structured body blocks (`p`, `h2`, `h3`, `ul`,
   `ol`, `quote`, `callout`). Inline markup supports `**bold**`, `*italic*` and `[links](/path)`.
5. **Contact details** — phone, location and hours in `src/data/site.ts` are placeholders
   (`+00 000 000 000`). Replace with verified information.

---

## SEO

- Unique `<title>` and meta description per route, plus canonical URLs, Open Graph and Twitter
  tags — managed by `components/Seo.tsx`.
- Structured data: `Organization`, `WebSite`, `ItemList` (home), `Service` + `FAQPage` +
  `BreadcrumbList` (service pages), `CollectionPage` (portfolio), `CreativeWork` (projects),
  `Blog` / `BlogPosting` (journal), `AboutPage`, `ContactPage`.
- `public/sitemap.xml` lists every route; `public/robots.txt` points at it.
- Semantic landmarks throughout: one `<h1>` per page, ordered headings, `<table>` with `<caption>`
  and scoped headers for the service comparison, `<time>` for dates, `<details>` for FAQs.
- Accessibility: skip link, visible focus rings, labelled form controls, `aria-live` status
  regions, `prefers-reduced-motion` honoured globally.

Because this is a client-rendered SPA, meta tags are applied at runtime. If you need crawler-visible
head tags without JavaScript, the same data files drive a static prerender step without
restructuring.

---

## Verification performed

- `npm run typecheck` — clean under `strict`, `noUnusedLocals`, `noUnusedParameters`.
- `npm run verify` — renders all 13 route patterns server-side and asserts expected content is
  present (13/13 passing).
- `npm run build` — production build succeeds.
- Dev server: all page routes, deep links, sitemap, robots and favicon return `200`; stale source
  module transforms return `200`; unknown Host headers are rejected with `403`.

Interactive browser behaviour (pointer parallax, drag interactions, filter animations) was verified
by construction and by the render tests; it has **not** been exercised in a real browser from this
environment.
