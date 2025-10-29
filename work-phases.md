Perfect—let’s tackle this in small, confidence-building phases. Here’s a focused “Immediate Next Step” plus the short phased plan that follows. Each phase ends with clear acceptance criteria.

# Immediate Next Step (Phase 0): Prep + Dependencies

**Goal:** Make the current codebase ready for content collections and per-post pages.

**Tasks**

* Create a working branch: `feat/content-collections`.
* Add deps: `@astrojs/mdx`, `@astrojs/sitemap`, `fuse.js`.
* Update `astro.config.mjs` to include `mdx()` and `sitemap()`.
* Commit and run a clean build.

**Commands**

```bash
git checkout -b feat/content-collections
npm i @astrojs/mdx @astrojs/sitemap fuse.js
# update astro.config.mjs to include mdx() and sitemap()
npm run build && npm run preview
```

**Acceptance criteria**

* Build succeeds locally.
* Site still renders exactly as before (no content or layout regressions).

---

# Phase 1: Content Collections + Dynamic Post Route

**Goal:** Move Nuggets from hard-coded data to MDX content.

**Tasks**

* Add `src/content/config.ts` with a `nuggets` collection schema (title, summary, tags, date, readTime, published).
* Create `src/content/nuggets/` and add 3 MDX posts:

  * Idempotency Keys in Payment APIs
  * Redis Locks without Regrets
  * RAG Context Windows (Small, Smart, and On-Topic)
* Add `src/pages/nuggets/[slug].astro` to render individual nuggets using the content collection.

**Acceptance criteria**

* Visiting `/nuggets/<slug>` renders each MDX post with title, meta (date, read time), and content.
* 404s for unknown slugs.

---

# Phase 2: Nuggets Index + Client-Side Search

**Goal:** Replace the hard-coded Nuggets list with a generated list + fuzzy search.

**Tasks**

* Update `/nuggets` page to source from the `nuggets` collection, sorted by date desc.
* Add a small Fuse.js search box filtering by title/summary/tags.
* Keep results accessible and keyboard-friendly.

**Acceptance criteria**

* `/nuggets` shows newest-first list generated from MDX.
* Typing in the search box filters cards live.

---

# Phase 3: SEO & Social Basics

**Goal:** Ship the must-haves for discovery and shareability.

**Tasks**

* Ensure `@astrojs/sitemap` is active; verify sitemap builds.
* Add `public/robots.txt` referencing the sitemap.
* Add default OG/Twitter meta in the base layout; include `og:image` fallback.
* Optional: generate per-nugget OG tags from frontmatter.

**Acceptance criteria**

* `sitemap-index.xml` is generated.
* `robots.txt` is served.
* Sharing a post URL shows sane title/description (OG preview tools look correct).

---

# Phase 4: A11y & Nav Polish

**Goal:** Improve accessibility and UX in small, meaningful ways.

**Tasks**

* Add `aria-current="page"` for the active route.
* Add `aria-expanded` to the mobile menu toggle and keep it in sync.
* Add a “Skip to content” link.
* Check focus outlines are visible against your color scheme.

**Acceptance criteria**

* Keyboard-only navigation is comfortable.
* Basic automated a11y pass (e.g., Lighthouse/axe) shows no critical issues.

---

# Phase 5 (Optional now, easy later): Comments (Giscus)

**Goal:** Enable lightweight discussions on nugget pages.

**Tasks**

* Add a `Giscus.astro` component and render it only on `[slug].astro`.
* Use public env vars for repo/category IDs.

**Acceptance criteria**

* Comments load only on post pages.
* No script is loaded on index or non-post pages.

---

# Phase 6: Deploy & Preview

**Goal:** Get reliable previews and a clean production build.

**Tasks**

* Cloudflare Pages: Build `npm run build`, Output `dist`.
* Ensure env vars (if any) are set for preview/production.

**Acceptance criteria**

* Preview deploy reflects the branch.
* Production build passes and serves all routes (including dynamic slugs).

---

# Phase 7: QA & Performance Touch-ups

**Goal:** Check quality, fix papercuts, and hit good Core Web Vitals.

**Tasks**

* Lighthouse run on `/` and one nugget page; address obvious layout shifts or blocking resources.
* Verify images have width/height and compress hero/OG if needed.
* Sanity-check 404 page and edge cases (empty search, very long titles).

**Acceptance criteria**

* No broken links, good LCP/CLS on key pages, and clean console.

---

## Backlog (nice-to-haves to schedule after)

* RSS feed for Nuggets.
* GitHub Action for content linting or nugget PR gating.
* Analytics (privacy-friendly), newsletter provider integration.
* Tag pages and “related nuggets”.
