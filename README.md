# Touch & Move

## Structure
- `index.html`, `about.html`, `services.html`, `contact.html`, and other pages are static HTML.
- `assets/css/style.css` and `assets/js/main.js` are linked from every page.
- `contact.php` handles the contact form and stores submissions in `data/contact-submissions.csv`.

## Setup
1. Replace `https://your-domain.com/` in `robots.txt` and `sitemap.xml` with your real domain.
2. Build CSS: `npm run build:css`.
3. Deploy all files to your hosting (Apache/Nginx).
4. Ensure PHP is enabled for the contact form.

## Notes
- UI is unchanged; Tailwind is now compiled for production (no CDN).
