import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const siteConfigPath = path.join(root, "assets", "data", "site.json");
const site = JSON.parse(fs.readFileSync(siteConfigPath, "utf8"));
const configuredBaseUrl = process.env.SITE_BASE_URL || site.baseUrl || "";
const baseUrl = configuredBaseUrl.replace(/\/+$/, "");
const pages = Array.isArray(site.pages) ? site.pages : [];

function isValidProductionUrl(value) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname !== "your-domain.com" &&
      url.hostname !== "example.com"
    );
  } catch {
    return false;
  }
}

if (!isValidProductionUrl(baseUrl)) {
  console.error(
    [
      "SEO generation requires a real SITE_BASE_URL before production build.",
      "Set SITE_BASE_URL in your environment or update assets/data/site.json.",
    ].join(" "),
  );
  process.exit(1);
}

const urlset = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((page) => `  <url><loc>${baseUrl}/${page.href}</loc></url>`),
  "</urlset>",
  "",
].join("\n");

const robots = [
  "User-agent: *",
  "Allow: /",
  "",
  `Sitemap: ${baseUrl}/sitemap.xml`,
  "",
].join("\n");

fs.writeFileSync(path.join(root, "sitemap.xml"), urlset, "utf8");
fs.writeFileSync(path.join(root, "robots.txt"), robots, "utf8");
