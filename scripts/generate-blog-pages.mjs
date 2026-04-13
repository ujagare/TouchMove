import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const siteConfigPath = path.join(root, "assets", "data", "site.json");
const blogPostsPath = path.join(root, "data", "blog-posts.json");
const outputDir = path.join(root, "blog");

const site = JSON.parse(fs.readFileSync(siteConfigPath, "utf8"));
const blogPostsData = fs.existsSync(blogPostsPath)
  ? JSON.parse(fs.readFileSync(blogPostsPath, "utf8"))
  : { posts: [] };

const configuredBaseUrl = process.env.SITE_BASE_URL || site.baseUrl || "";
const baseUrl = configuredBaseUrl.replace(/\/+$/, "");
const posts = Array.isArray(blogPostsData.posts) ? blogPostsData.posts : [];

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function absoluteUrl(relativePath) {
  return `${baseUrl}/${String(relativePath || "").replace(/^\/+/, "")}`;
}

function postUrl(slug) {
  return `${baseUrl}/blog/${encodeURIComponent(slug)}.html`;
}

function relatedPostHref(slug) {
  return `${encodeURIComponent(slug)}.html`;
}

function pageHref(href) {
  return `../${String(href || "").replace(/^\/+/, "")}`;
}

function contextualLinksForPost(slug) {
  const linksBySlug = {
    "tarot-mirror-to-your-soul": [
      {
        href: pageHref("why-clients-work-with-us.html"),
        label: "Explore tarot guidance",
        copy: "Understand how tarot sessions support clarity, reflection, and intuitive decision-making.",
      },
      {
        href: pageHref("services.html"),
        label: "Browse healing services",
        copy: "See how tarot, sound healing, movement, and distance support are offered together.",
      },
      {
        href: pageHref("contact.html"),
        label: "Book a session",
        copy: "Reach out when you are ready for personal guidance or a deeper reading.",
      },
    ],
    "power-of-sound-healing": [
      {
        href: pageHref("services.html"),
        label: "View sound healing support",
        copy: "Explore healing sessions designed around regulation, energetic balance, and inner harmony.",
      },
      {
        href: relatedPostHref("somatic-awareness"),
        label: "Read about somatic awareness",
        copy: "Continue with body-based listening and nervous-system awareness practices.",
      },
      {
        href: pageHref("contact.html"),
        label: "Ask about a session",
        copy: "Connect directly if you want personalized support through sound and energy work.",
      },
    ],
    "numerology-for-success": [
      {
        href: pageHref("services.html"),
        label: "Explore astro-numerology sessions",
        copy: "See how timing, numbers, and intuitive guidance are integrated in practice.",
      },
      {
        href: pageHref("why-clients-work-with-us.html"),
        label: "Pair numbers with tarot insight",
        copy: "Discover how symbolic guidance can deepen clarity around choices and timing.",
      },
      {
        href: pageHref("contact.html"),
        label: "Book aligned guidance",
        copy: "Reach out if you want support with your current cycle, direction, or decision-making.",
      },
    ],
    "movement-as-meditation": [
      {
        href: pageHref("services.html"),
        label: "Explore movement therapy",
        copy: "See how movement sessions support emotional release, expression, and embodiment.",
      },
      {
        href: relatedPostHref("somatic-awareness"),
        label: "Continue with somatic awareness",
        copy: "Read the companion reflection on listening to the body with more trust.",
      },
      {
        href: pageHref("Aproch.html"),
        label: "Read the Touch and Move approach",
        copy: "Understand the philosophy behind embodied practice, presence, and transformation.",
      },
    ],
    "unlocking-your-sacred-journey": [
      {
        href: pageHref("our-Aproch.html"),
        label: "See who this work is for",
        copy: "Explore how the work supports seekers moving through transition, tenderness, and growth.",
      },
      {
        href: pageHref("services.html"),
        label: "Browse your next support option",
        copy: "Find sessions that match where you are on your healing or spiritual path.",
      },
      {
        href: pageHref("contact.html"),
        label: "Begin the conversation",
        copy: "Connect when you are ready to take the next step with guidance and support.",
      },
    ],
    "rituals-for-the-modern-home": [
      {
        href: pageHref("kuber-energy-activation.html"),
        label: "Explore Kuber energy rituals",
        copy: "Discover a guided abundance practice rooted in ritual, tarot, and daily integration.",
      },
      {
        href: pageHref("services.html"),
        label: "Find supportive healing sessions",
        copy: "Pair your personal rituals with one-to-one sessions for deeper transformation.",
      },
      {
        href: relatedPostHref("unlocking-your-sacred-journey"),
        label: "Read the sacred journey reflection",
        copy: "Continue with a companion article on trust, thresholds, and intentional growth.",
      },
    ],
    "somatic-awareness": [
      {
        href: pageHref("services.html"),
        label: "Explore embodiment sessions",
        copy: "Browse movement, consciousness, and healing support rooted in body awareness.",
      },
      {
        href: relatedPostHref("movement-as-meditation"),
        label: "Read movement as meditation",
        copy: "Continue with a related reflection on rhythm, presence, and embodied stillness.",
      },
      {
        href: pageHref("contact.html"),
        label: "Book embodied support",
        copy: "Reach out for guidance if you want help reconnecting with the body and its signals.",
      },
    ],
  };

  return (
    linksBySlug[slug] || [
      {
        href: pageHref("services.html"),
        label: "Explore healing services",
        copy: "Find sessions related to embodiment, guidance, and personal transformation.",
      },
      {
        href: pageHref("blog.html"),
        label: "Return to the journal",
        copy: "Keep reading related reflections on ritual, sound healing, tarot, and somatics.",
      },
      {
        href: pageHref("contact.html"),
        label: "Book a session",
        copy: "Reach out for one-to-one support when you feel ready to begin.",
      },
    ]
  );
}

function sectionMarkup(section) {
  return [
    '<section class="blog-detail-section">',
    '<div class="blog-detail-section-head">',
    "<span></span>",
    `<h2>${escapeHtml(section.heading)}</h2>`,
    "</div>",
    '<div class="blog-detail-body-copy">',
    `<p>${escapeHtml(section.body)}</p>`,
    "</div>",
    "</section>",
  ].join("");
}

function contextualLinksMarkup(post) {
  return [
    '<section class="blog-detail-resources" aria-label="Related guidance and internal links">',
    '<div class="blog-detail-section-head">',
    "<span></span>",
    "<h2>Related guidance for this topic</h2>",
    "</div>",
    '<div class="blog-detail-resources-grid">',
    contextualLinksForPost(post.slug)
      .map(
        (link) => `
          <article class="blog-detail-resource-card">
            <h3>${escapeHtml(link.label)}</h3>
            <p>${escapeHtml(link.copy)}</p>
            <a href="${escapeHtml(link.href)}">Open page</a>
          </article>`,
      )
      .join(""),
    "</div>",
    "</section>",
  ].join("");
}

function relatedMarkup(post) {
  return `
    <article class="blog-related-card">
      <a class="blog-related-link-block" href="${escapeHtml(relatedPostHref(post.slug))}" style="display: block; color: inherit; text-decoration: none;">
        <div class="blog-related-media">
          <img decoding="async" loading="lazy" src="../${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" />
        </div>
        <div class="blog-related-copy">
          <p class="blog-kicker">${escapeHtml(post.category)}</p>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.excerpt)}</p>
        </div>
      </a>
    </article>`;
}

function structuredData(post, canonicalUrl, imageUrl) {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      image: imageUrl,
      url: canonicalUrl,
      datePublished: post.date,
      dateModified: post.date,
      articleSection: post.category,
      author: {
        "@type": "Organization",
        name: "Touch and Move",
      },
      publisher: {
        "@type": "Organization",
        name: "Touch and Move",
        url: `${baseUrl}/`,
      },
    },
    null,
    2,
  );
}

function renderPostPage(post, relatedPosts) {
  const canonicalUrl = postUrl(post.slug);
  const imageUrl = absoluteUrl(post.image);
  const title = `${post.title} | Touch and Move`;
  const related = relatedPosts.map(relatedMarkup).join("");
  const sections = post.sections.map(sectionMarkup).join("") + contextualLinksMarkup(post);

  return `<!doctype html>
<html class="dark" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <meta
      name="google-site-verification"
      content="DQUIdFZAN0yXz-YXVh9KbTCLxUuwwCsRwZI285GDb_g"
    />
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-X5F49C1R7J"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());
      gtag("config", "G-X5F49C1R7J");
    </script>
    <meta name="description" content="${escapeHtml(post.excerpt)}" />
    <meta name="robots" content="index, follow" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(post.excerpt)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="article:published_time" content="${escapeHtml(post.date)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(post.excerpt)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <meta name="author" content="Touch and Move" />
    <meta name="theme-color" content="#15110d" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <script id="blogDetailStructuredData" type="application/ld+json">
${structuredData(post, canonicalUrl, imageUrl)}
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&amp;display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
      rel="stylesheet"
    />
    <link rel="icon" href="../assets/favicon/android-chrome-512x512.png" type="image/x-icon" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="../assets/css/style.css?v=3" />
    <link rel="stylesheet" href="../assets/css/shared.css?v=2" />
    <link rel="stylesheet" href="../assets/css/pages/blog-detail.css?v=2" />
  </head>
  <body class="tm-warm-theme bg-background-dark text-slate-200 selection:bg-primary/30">
    <div class="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <div class="layout-container flex h-full grow flex-col">
        <header
          id="navbar"
          class="fixed top-0 left-0 w-full backdrop-blur-md bg-black/40 border-b border-white/10"
          style="animation: slideNavDown 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 10000; transition: transform 0.4s ease, background-color 0.4s ease;"
        >
          <div class="w-full px-6 md:px-12 py-6 flex items-center justify-between">
            <a href="../index.html" class="brand-lockup flex items-center gap-3 z-50 relative">
              <img decoding="async" loading="lazy" src="../assets/images/logo-touch-and-move.png" alt="Touch & Move Logo" class="object-contain" style="height: 64px; width: auto; max-width: 200px" />
              <span class="brand-wordmark text-white tracking-widest font-semibold uppercase" style="font-size: 1.125rem">
                Touch & Move
              </span>
            </a>
            <div class="flex items-center justify-end" style="gap: 16px">
              <a
                href="../contact.html"
                class="book-now-btn inline-block text-white uppercase font-semibold hover:opacity-80 transition-all z-50 relative"
                style="background-color: #9e8976; padding: 10px 24px; font-size: 10px; letter-spacing: 2px;"
              >
                Book Now
              </a>
            </div>
          </div>
        </header>

        <main class="blog-detail-main flex-1">
          <section class="blog-detail-hero">
            <img
              class="blog-detail-hero-image"
              src="../${escapeHtml(post.image)}"
              alt="${escapeHtml(post.title)}"
            />
            <div class="blog-detail-shell">
              <div class="blog-detail-hero-copy">
                <p class="blog-kicker">${escapeHtml(post.category)}</p>
                <h1 class="blog-detail-title">${escapeHtml(post.title)}</h1>
                <p class="blog-detail-meta">${escapeHtml(post.dateLabel)} | ${escapeHtml(post.readTime)}</p>
              </div>
            </div>
          </section>

          <article class="blog-detail-shell blog-detail-article">
            <div class="blog-detail-content">
              <p class="blog-detail-intro">${escapeHtml(post.intro)}</p>
              <blockquote class="blog-detail-quote">
                <p>${escapeHtml(post.quote)}</p>
              </blockquote>
              <div>${sections}</div>
            </div>
            <aside class="blog-detail-aside">
              <div class="blog-detail-aside-card">
                <p class="blog-kicker">Journal Navigation</p>
                <a href="../blog.html">Back to Journal</a>
              </div>
            </aside>
          </article>

          <section class="blog-detail-shell blog-detail-related">
            <div class="blog-detail-related-head">
              <div>
                <p class="blog-kicker">Keep Reading</p>
                <h2>More from the journal</h2>
              </div>
              <a href="../blog.html" class="blog-detail-related-link">View All Journal</a>
            </div>
            <div class="blog-detail-related-grid">
              ${related}
            </div>
          </section>
        </main>

        <footer id="homeFooter" class="py-20 md:py-24">
          <div class="max-w-420 mx-auto px-4 md:px-6 lg:px-8">
            <div class="tm-footer-shell rounded-4xl px-6 py-10 md:px-10 md:py-14 lg:px-12">
              <div class="grid gap-7 border-b pb-10 md:grid-cols-12 md:items-start md:gap-8 md:pb-12 tm-footer-divider">
                <div class="md:col-span-5">
                  <div class="tm-footer-card rounded-3xl p-6 md:p-7">
                    <div class="flex items-center gap-3">
                      <img decoding="async" loading="lazy" alt="Harshaa Tarot Logo" class="h-4 w-auto" src="../assets/images/logo-touch-and-move.png" />
                      <h2 class="text-white uppercase text-xs tracking-[0.3em] font-bold">Touch and Move</h2>
                    </div>
                    <p class="mt-5 max-w-md text-base font-light italic leading-loose text-slate-400">
                      Architects of conscious stillness and transformative motion. Offering grounded, intuitive guidance for seekers across the world.
                    </p>
                  </div>
                </div>
                <div class="md:col-span-4">
                  <div class="tm-footer-card rounded-3xl p-6 md:p-7">
                    <h4 class="font-bold mb-5 text-white uppercase text-[11px] tracking-[0.3em]">Explore</h4>
                    <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                      <a class="tm-footer-link block py-1 text-xs uppercase tracking-[0.18em] transition-colors" href="../index.html">Home</a>
                      <a class="tm-footer-link block py-1 text-xs uppercase tracking-[0.18em] transition-colors" href="../about.html">Our Journey</a>
                      <a class="tm-footer-link block py-1 text-xs uppercase tracking-[0.18em] transition-colors" href="../services.html">Guidance & Services</a>
                      <a class="tm-footer-link block py-1 text-xs uppercase tracking-[0.18em] transition-colors" href="../why-clients-work-with-us.html">Tarot with Harshaa</a>
                      <a class="tm-footer-link block py-1 text-xs uppercase tracking-[0.18em] transition-colors" href="../Aproch.html">Approach & Philosophy</a>
                      <a class="tm-footer-link block py-1 text-xs uppercase tracking-[0.18em] transition-colors" href="../our-Aproch.html">Who This Work Is For</a>
                      <a class="tm-footer-link block py-1 text-xs uppercase tracking-[0.18em] transition-colors" href="../blog.html">Blog</a>
                      <a class="tm-footer-link block py-1 text-xs uppercase tracking-[0.18em] transition-colors" href="../contact.html">Contact</a>
                    </div>
                  </div>
                </div>
                <div class="md:col-span-3">
                  <div class="tm-footer-card rounded-3xl p-6 md:p-7">
                    <h4 class="font-bold mb-5 text-white uppercase text-[11px] tracking-[0.3em]">Connect</h4>
                    <ul class="space-y-4 text-base leading-loose">
                      <li><a class="tm-footer-link transition-colors" href="mailto:touchandmove.69@gmail.com">touchandmove.69@gmail.com</a></li>
                      <li>
                        <a class="tm-footer-link transition-colors" href="tel:+919511246401">+91 9511246401</a> /
                        <a class="tm-footer-link transition-colors" href="tel:+918698304955">8698304955</a>
                      </li>
                      <li class="text-slate-400">Online (Worldwide) | In-person (Pune, India)</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="mt-8 flex flex-col items-center justify-between gap-4 pt-6 text-center md:flex-row">
                <p>&copy; 2026 Touch and Move</p>
                <div class="flex items-center gap-6 text-slate-500 text-[11px] tracking-[0.24em]">
                  <a class="tm-footer-link transition-colors text-primary normal-case" href="https://codesunny.in" target="_blank" rel="noopener noreferrer">codesunny.in</a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
    <script src="../assets/vendor/lenis.min.js" defer></script>
    <script src="../assets/js/main.js?v=22" defer></script>
  </body>
</html>
`;
}

fs.mkdirSync(outputDir, { recursive: true });

for (const post of posts) {
  if (!post?.slug) continue;
  const relatedPosts = posts.filter((item) => item.slug !== post.slug).slice(0, 3);
  const filePath = path.join(outputDir, `${post.slug}.html`);
  fs.writeFileSync(filePath, renderPostPage(post, relatedPosts), "utf8");
}
