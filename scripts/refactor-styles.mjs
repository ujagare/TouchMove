import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const htmlFiles = [
  "index.html",
  "about.html",
  "services.html",
  "contact.html",
  "client-intake.html",
  "Aproch.html",
  "our-Aproch.html",
  "why-clients-work-with-us.html",
];

const pageCssDir = path.join(root, "assets", "css", "pages");
fs.mkdirSync(pageCssDir, { recursive: true });

const styleLink = '    <link rel="stylesheet" href="./assets/css/style.css?v=2" />\n';

function slugify(filename) {
  return filename.replace(/\.html$/i, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

function extractVars(css) {
  const vars = new Map();
  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars.set(match[1], match[2].trim());
  }
  return vars;
}

function replaceVars(css, vars) {
  let output = css;
  for (const [name, value] of vars.entries()) {
    output = output.replaceAll(`var(${name})`, value);
  }
  return output;
}

for (const file of htmlFiles) {
  const fullPath = path.join(root, file);
  let html = fs.readFileSync(fullPath, "utf8");
  const slug = slugify(file);
  const pageLink = `    <link rel="stylesheet" href="./assets/css/pages/${slug}.css?v=2" />\n`;

  const extractedCss = [];
  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const originalCss = match[1];
    const vars = extractVars(originalCss);
    let cleaned = originalCss.replace(/:root\s*{[\s\S]*?}\s*/gi, "");
    cleaned = replaceVars(cleaned, vars).trim();
    if (cleaned) {
      extractedCss.push(`/* ${file} */\n${cleaned}`);
    }
  }

  const pageCssPath = path.join(pageCssDir, `${slug}.css`);
  const pageCss = extractedCss.length
    ? `${extractedCss.join("\n\n")}\n`
    : `/* ${file}: no extracted page-specific CSS */\n`;
  fs.writeFileSync(pageCssPath, pageCss, "utf8");

  html = html.replace(/<script[^>]*src="https:\/\/cdn\.tailwindcss\.com[^"]*"[^>]*><\/script>\s*/gi, "");
  html = html.replace(/<script id="tailwind-config"[\s\S]*?<\/script>\s*/gi, "");
  html = html.replace(/\s*<link[^>]*href="\.\/*assets\/css\/mobile\.css(?:\?[^"]*)?"[^>]*>\s*/gi, "\n");
  html = html.replace(/\s*<link[^>]*href="\.\/*assets\/css\/style\.css(?:\?[^"]*)?"[^>]*>\s*/gi, "\n");
  html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>\s*/gi, "");
  html = html.replace(/<\/head>/i, `${styleLink}${pageLink}  </head>`);

  fs.writeFileSync(fullPath, html, "utf8");
}
