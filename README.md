# Touch & Move

## Structure
- `index.html`, `about.html`, `services.html`, `contact.html`, and the remaining pages are static HTML entry points.
- Shared styles compile into `assets/css/style.css`.
- Page-specific styles live in `assets/css/pages/`.
- Shared interactions live in `assets/js/main.js`.
- `api/contact.js` handles contact and workshop form submissions on Vercel.
- `vercel.json` contains the Vercel build, function, cache, and security-header settings.

## Vercel Production Setup
1. Set the live domain in `assets/data/site.json` under `baseUrl`.
2. Add the environment variables from `.env.example` in Vercel Project Settings.
3. Import this folder in Vercel and use the default config from `vercel.json`.
4. Vercel build command: `npm run build`.
5. Vercel output directory: `.`.

## Build Commands
- `npm run build:css`
- `npm run build:seo`
- `npm run build`

## Notes
- Contact form email uses Resend through `api/contact.js`.
- `scripts/generate-seo.mjs` regenerates `robots.txt` and `sitemap.xml` from `assets/data/site.json`.
- UI and functionality are intended to remain unchanged while shipping safer production defaults.
