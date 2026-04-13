(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function text(value) {
    return String(value || "").trim();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setMetaContent(selector, value) {
    var element = document.querySelector(selector);
    if (!element || !value) return;
    element.setAttribute("content", value);
  }

  function setLinkHref(selector, value) {
    var element = document.querySelector(selector);
    if (!element || !value) return;
    element.setAttribute("href", value);
  }

  function absoluteAssetUrl(value) {
    if (!value) return "";

    try {
      return new URL(value, window.location.href).href;
    } catch (error) {
      return value;
    }
  }

  function productionPostUrl(slug) {
    return (
      "https://ujagare.github.io/TouchMove/blog/" +
      encodeURIComponent(slug || "") +
      ".html"
    );
  }

  function updateStructuredData(post, imageUrl, pageUrl) {
    var script = $("blogDetailStructuredData");
    if (!script) return;

    script.textContent = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: text(post.title),
        description: text(post.excerpt),
        image: imageUrl,
        url: pageUrl,
        datePublished: text(post.date),
        dateModified: text(post.date),
        articleSection: text(post.category),
        author: {
          "@type": "Organization",
          name: "Touch and Move",
        },
        publisher: {
          "@type": "Organization",
          name: "Touch and Move",
        },
      },
      null,
      2,
    );
  }

  function syncSeo(post) {
    var description = text(post.excerpt);
    var title = text(post.title) + " | Touch and Move";
    var imageUrl = absoluteAssetUrl(post.image);
    var pageUrl = productionPostUrl(post.slug);

    document.title = title;
    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[property="og:image"]', imageUrl);
    setMetaContent('meta[property="og:url"]', pageUrl);
    setMetaContent('meta[name="twitter:title"]', title);
    setMetaContent('meta[name="twitter:description"]', description);
    setMetaContent('meta[name="twitter:image"]', imageUrl);
    setMetaContent('meta[property="article:published_time"]', text(post.date));
    setLinkHref('link[rel="canonical"]', pageUrl);
    updateStructuredData(post, imageUrl, pageUrl);
  }

  function getSlug() {
    var params = new URLSearchParams(window.location.search);
    return text(params.get("slug"));
  }

  function sectionMarkup(section) {
    return [
      '<section class="blog-detail-section">',
      '<div class="blog-detail-section-head">',
      '<span></span>',
      "<h2>" + escapeHtml(section.heading) + "</h2>",
      "</div>",
      '<div class="blog-detail-body-copy">',
      "<p>" + escapeHtml(section.body) + "</p>",
      "</div>",
      "</section>",
    ].join("");
  }

  function relatedMarkup(post) {
    return [
      '<article class="blog-related-card" data-slug="' + escapeHtml(post.slug) + '">',
      '<div class="blog-related-media"><img decoding="async" loading="lazy" src="' + escapeHtml(post.image) + '" alt="' + escapeHtml(post.title) + '" /></div>',
      '<div class="blog-related-copy">',
      '<p class="blog-kicker">' + escapeHtml(post.category) + "</p>",
      "<h3>" + escapeHtml(post.title) + "</h3>",
      "<p>" + escapeHtml(post.excerpt) + "</p>",
      "</div>",
      "</article>",
    ].join("");
  }

  function contextualLinksForPost(slug) {
    var linksBySlug = {
      "tarot-mirror-to-your-soul": [
        {
          href: "why-clients-work-with-us.html",
          label: "Explore tarot guidance",
          copy: "Understand how tarot sessions support clarity, reflection, and intuitive decision-making.",
        },
        {
          href: "services.html",
          label: "Browse healing services",
          copy: "See how tarot, sound healing, movement, and distance support are offered together.",
        },
        {
          href: "contact.html",
          label: "Book a session",
          copy: "Reach out when you are ready for personal guidance or a deeper reading.",
        },
      ],
      "power-of-sound-healing": [
        {
          href: "services.html",
          label: "View sound healing support",
          copy: "Explore healing sessions designed around regulation, energetic balance, and inner harmony.",
        },
        {
          href: "blog/somatic-awareness.html",
          label: "Read about somatic awareness",
          copy: "Continue with body-based listening and nervous-system awareness practices.",
        },
        {
          href: "contact.html",
          label: "Ask about a session",
          copy: "Connect directly if you want personalized support through sound and energy work.",
        },
      ],
      "numerology-for-success": [
        {
          href: "services.html",
          label: "Explore astro-numerology sessions",
          copy: "See how timing, numbers, and intuitive guidance are integrated in practice.",
        },
        {
          href: "why-clients-work-with-us.html",
          label: "Pair numbers with tarot insight",
          copy: "Discover how symbolic guidance can deepen clarity around choices and timing.",
        },
        {
          href: "contact.html",
          label: "Book aligned guidance",
          copy: "Reach out if you want support with your current cycle, direction, or decision-making.",
        },
      ],
      "movement-as-meditation": [
        {
          href: "services.html",
          label: "Explore movement therapy",
          copy: "See how movement sessions support emotional release, expression, and embodiment.",
        },
        {
          href: "blog/somatic-awareness.html",
          label: "Continue with somatic awareness",
          copy: "Read the companion reflection on listening to the body with more trust.",
        },
        {
          href: "Aproch.html",
          label: "Read the Touch and Move approach",
          copy: "Understand the philosophy behind embodied practice, presence, and transformation.",
        },
      ],
      "unlocking-your-sacred-journey": [
        {
          href: "our-Aproch.html",
          label: "See who this work is for",
          copy: "Explore how the work supports seekers moving through transition, tenderness, and growth.",
        },
        {
          href: "services.html",
          label: "Browse your next support option",
          copy: "Find sessions that match where you are on your healing or spiritual path.",
        },
        {
          href: "contact.html",
          label: "Begin the conversation",
          copy: "Connect when you are ready to take the next step with guidance and support.",
        },
      ],
      "rituals-for-the-modern-home": [
        {
          href: "kuber-energy-activation.html",
          label: "Explore Kuber energy rituals",
          copy: "Discover a guided abundance practice rooted in ritual, tarot, and daily integration.",
        },
        {
          href: "services.html",
          label: "Find supportive healing sessions",
          copy: "Pair your personal rituals with one-to-one sessions for deeper transformation.",
        },
        {
          href: "blog/unlocking-your-sacred-journey.html",
          label: "Read the sacred journey reflection",
          copy: "Continue with a companion article on trust, thresholds, and intentional growth.",
        },
      ],
      "somatic-awareness": [
        {
          href: "services.html",
          label: "Explore embodiment sessions",
          copy: "Browse movement, consciousness, and healing support rooted in body awareness.",
        },
        {
          href: "blog/movement-as-meditation.html",
          label: "Read movement as meditation",
          copy: "Continue with a related reflection on rhythm, presence, and embodied stillness.",
        },
        {
          href: "contact.html",
          label: "Book embodied support",
          copy: "Reach out for guidance if you want help reconnecting with the body and its signals.",
        },
      ],
    };

    return (
      linksBySlug[slug] || [
        {
          href: "services.html",
          label: "Explore healing services",
          copy: "Find sessions related to embodiment, guidance, and personal transformation.",
        },
        {
          href: "blog.html",
          label: "Return to the journal",
          copy: "Keep reading related reflections on ritual, sound healing, tarot, and somatics.",
        },
        {
          href: "contact.html",
          label: "Book a session",
          copy: "Reach out for one-to-one support when you feel ready to begin.",
        },
      ]
    );
  }

  function contextualLinksMarkup(post) {
    var links = contextualLinksForPost(post.slug);

    return [
      '<section class="blog-detail-resources" aria-label="Related guidance and internal links">',
      '<div class="blog-detail-section-head">',
      "<span></span>",
      "<h2>Related guidance for this topic</h2>",
      "</div>",
      '<div class="blog-detail-resources-grid">',
      links
        .map(function (link) {
          return [
            '<article class="blog-detail-resource-card">',
            "<h3>" + escapeHtml(link.label) + "</h3>",
            "<p>" + escapeHtml(link.copy) + "</p>",
            '<a href="' + escapeHtml(link.href) + '">Open page</a>',
            "</article>",
          ].join("");
        })
        .join(""),
      "</div>",
      "</section>",
    ].join("");
  }

  function render(post, posts) {
    syncSeo(post);

    $("blogDetailCategory").textContent = post.category;
    $("blogDetailTitle").textContent = post.title;
    $("blogDetailMeta").textContent = post.dateLabel + " | " + post.readTime;
    $("blogDetailHeroImage").src = post.image;
    $("blogDetailHeroImage").alt = post.title;
    $("blogDetailIntro").textContent = post.intro;
    $("blogDetailQuote").textContent = post.quote;
    $("blogDetailSections").innerHTML =
      post.sections.map(sectionMarkup).join("") + contextualLinksMarkup(post);

    var related = posts
      .filter(function (item) {
        return item.slug !== post.slug;
      })
      .slice(0, 3);

    $("blogDetailRelatedGrid").innerHTML = related.map(relatedMarkup).join("");

    Array.prototype.slice
      .call(document.querySelectorAll(".blog-related-card"))
      .forEach(function (card) {
        var slug = card.getAttribute("data-slug");
        if (!slug) return;
        card.style.cursor = "pointer";
        card.addEventListener("click", function () {
          window.location.href = "blog/" + encodeURIComponent(slug) + ".html";
        });
      });
  }

  function renderNotFound() {
    document.title = "Journal | Touch and Move";
    setMetaContent(
      'meta[name="description"]',
      "The requested journal entry could not be found on Touch and Move.",
    );
    setMetaContent('meta[property="og:title"]', "Journal | Touch and Move");
    setMetaContent(
      'meta[property="og:description"]',
      "The requested journal entry could not be found on Touch and Move.",
    );
    setMetaContent(
      'meta[name="twitter:title"]',
      "Journal | Touch and Move",
    );
    setMetaContent(
      'meta[name="twitter:description"]',
      "The requested journal entry could not be found on Touch and Move.",
    );
    setMetaContent(
      'meta[property="og:url"]',
      "https://ujagare.github.io/TouchMove/blogdetail.html",
    );
    setLinkHref(
      'link[rel="canonical"]',
      "https://ujagare.github.io/TouchMove/blogdetail.html",
    );
    $("blogDetailTitle").textContent = "Journal entry not found";
    $("blogDetailMeta").textContent = "Please return to the journal and choose another article.";
    $("blogDetailIntro").textContent =
      "We could not find the article you were looking for. You can go back to the journal to explore available posts.";
    $("blogDetailQuote").textContent =
      "Every path circles back to the place where attention begins again.";
    $("blogDetailSections").innerHTML =
      '<section class="blog-detail-section"><div class="blog-detail-section-head"><span></span><h2>Return to the journal</h2></div><div class="blog-detail-body-copy"><p><a href="blog.html">Open the journal page</a> to continue reading.</p></div></section>';
    $("blogDetailRelatedGrid").innerHTML = "";
    updateStructuredData(
      {
        title: "Journal | Touch and Move",
        excerpt: "The requested journal entry could not be found on Touch and Move.",
        image:
          "https://ujagare.github.io/TouchMove/assets/webp%20images/site-image-28.webp",
        date: "",
        category: "Journal",
      },
      "https://ujagare.github.io/TouchMove/assets/webp%20images/site-image-28.webp",
      "https://ujagare.github.io/TouchMove/blogdetail.html",
    );
  }

  function init() {
    var slug = getSlug();

    if (slug) {
      window.location.replace("blog/" + encodeURIComponent(slug) + ".html");
      return;
    }
    window.location.replace("blog.html");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
