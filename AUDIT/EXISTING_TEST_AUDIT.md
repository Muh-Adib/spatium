# EXISTING TEST AUDIT — UNIMASI STUDIO
**Auditor**: Zero-Trust QA & Adversarial System Auditor  
**Date**: 2026-11-03  
**Audit Standard**: NO EVIDENCE = NO PASS  

---

## 1. Inventory of Existing Tests

| Test Script / File | What It Claims | What It Actually Tests | Weaknesses / False Pass Risk | Zero-Trust Verdict |
|---|---|---|---|---|
| `scripts/m1-empirical-stress-test.ts` | Complete verification of all 20+ SDUI blocks under adversarial corrupted data. | Executes `renderToStaticMarkup` for 85 permutations of null/undefined/string/number data in blocks and tests `parseBlocks()` Zod parser. | Node.js ESM throws `ERR_UNKNOWN_FILE_EXTENSION` on `.css` imports unless loaded with `--loader ./scripts/css-loader.mjs`. Tests static HTML string output only; does not test browser hydration, GSAP timelines, or WebGL context. | **WEAK** (Unit SSR only; not E2E) |
| `scripts/validate-seed.ts` | Validates database seed integrity and schema correctness. | Validates local JSON files (`src/data/seed/*.json`) for non-empty arrays, schema field keys, and slug regexes. | Does not verify PostgreSQL foreign keys, unique constraint enforcement, Prisma 8 typed contracts, or actual database insertions. | **WEAK** (Disk JSON validator only) |
| `scripts/agent-eval.ts` | Evaluates AI Agent tool routing accuracy and safety across 30 enterprise scenarios. | Compares prompt patterns to registered tool definitions in `src/lib/agent/registry.ts`. | Runs static heuristics without invoking live Gemini/OpenRouter API key failover or testing actual tool execution against PostgreSQL. | **WEAK** (Static heuristic routing check) |
| `scripts/seo-audit.ts` | Full automated site crawl and SEO health scorecard. | Fetches live sitemap XML and checks HTTP response headers and OpenGraph tags. | Relies on external running server on port 3002; fails if server not pre-started. | **UNVERIFIED / CONDITIONAL** |
| `package.json` scripts | Complete automated test pipeline (`npm test`). | `package.json` contains `"scripts": { "dev", "build", "start", "typecheck", "db:push", "db:seed", ... }`. **There was NO `npm test` script!** | Zero continuous test automation entry point. | **MISSING** |

---

## 2. Adversarial Mutation Findings

1. **CSS Loader Dependency**:
   Running `npx tsx scripts/m1-empirical-stress-test.ts` failed immediately with:
   ```
   TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".css" for .../src/components/home/hero.css
   ```
   *Root Cause*: Node.js ESM does not recognize CSS files imported in React server components without a custom resolver. Fixed by executing with `--loader ./scripts/css-loader.mjs`.

2. **Tool Naming Legacy**:
   `scripts/agent-eval.ts` tested for `sqlite_articles_query`. In PostgreSQL via Prisma 8, the canonical tool name should be `db_articles_query`. While `sqlite_articles_query` is aliased in `src/lib/agent/registry.ts`, retaining `sqlite_*` names in test expectations creates cognitive debt.
