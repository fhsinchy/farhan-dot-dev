# farhan.dev — Personal site built with Astro

This is the source for Farhan’s personal website: a fast, content-driven site built with Astro, TypeScript, and Tailwind CSS. It features MDX-based "Nuggets" posts, automatic Open Graph image generation, an RSS feed, and a sitemap. The site is pre-rendered to static HTML for easy deployment on any static hosting provider.

## Features

- MDX content with Astro Content Collections for "Nuggets"
- Automatic OG image generation for posts (`/og/[...slug].png`)
- RSS feed at `/rss.xml` and sitemap generation
- Tailwind CSS styling with CSS variables-driven theme
- SEO-friendly pages and dynamic social previews

## Tech Stack

- Astro (`astro@^5`)
- TypeScript
- Tailwind CSS (`@astrojs/tailwind`)
- MDX (`@astrojs/mdx`)
- Sitemap (`@astrojs/sitemap`)
- Satori + Sharp for OG image PNG rendering

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install dependencies

```sh
npm install
```

### Run the dev server

```sh
npm run dev
```

Open http://localhost:4321 in your browser.

### Build for production

```sh
npm run build
```

The static site will be output to the `dist/` directory.

### Preview the production build

```sh
npm run preview
```

## Content authoring (Nuggets)

Nuggets are MDX files stored in `src/content/nuggets`. Content is validated via Astro Content Collections. Required frontmatter fields are defined in `src/content/config.ts`:

```md
---
title: "Post title"
summary: "Short description"
tags: ["Tag1", "Tag2"]
date: 2025-01-01
readTime: "3 min"
published: true
---

Your MDX content here...
```

Notes:
- `published` defaults to `true`. Set to `false` to exclude from lists and OG generation.
- OG images are generated at request time for each nugget via `src/pages/og/[...slug].png.ts` using the frontmatter values.

## Project structure (high level)

- `src/pages` — site pages, RSS, OG image routes
- `src/components` — page components and UI
- `src/content` — content collections (MDX) and schema
- `src/utils` — utilities (e.g., `og-image.ts`)
- `public` — static assets, `_headers` and `_redirects`
- `dist` — production build output

## Deployment

This is a static Astro site. After `npm run build`, deploy the `dist/` directory to your hosting provider (e.g., Netlify, Vercel, Cloudflare Pages, GitHub Pages). The `public/_headers` and `public/_redirects` files are included in the build output and will be respected by hosts that support them.

The site URL is configured in `astro.config.mjs` as `site: 'https://farhan.dev'` for correct RSS and sitemap generation—update if you fork the project.

## Optional: AI generator worker

There is an optional Cloudflare Worker in `workers/ai-generator/`. If you want to develop or deploy it:

```sh
# Dev
npm run worker:dev

# Deploy
npm run worker:deploy

# Tail logs
npm run worker:tail
```

You’ll need a Cloudflare account and Wrangler configured for these commands.

## License

No license specified. All rights reserved unless otherwise noted.
