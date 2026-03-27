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
      "https://ujagare.github.io/TouchMove/blogdetail.html?slug=" +
      encodeURIComponent(slug || "")
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

  function render(post, posts) {
    syncSeo(post);

    $("blogDetailCategory").textContent = post.category;
    $("blogDetailTitle").textContent = post.title;
    $("blogDetailMeta").textContent = post.dateLabel + " | " + post.readTime;
    $("blogDetailHeroImage").src = post.image;
    $("blogDetailHeroImage").alt = post.title;
    $("blogDetailIntro").textContent = post.intro;
    $("blogDetailQuote").textContent = post.quote;
    $("blogDetailSections").innerHTML = post.sections.map(sectionMarkup).join("");

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
          window.location.href =
            "blogdetail.html?slug=" + encodeURIComponent(slug);
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
    fetch("./data/blog-posts.json")
      .then(function (response) {
        if (!response.ok) throw new Error("Failed to load blog posts.");
        return response.json();
      })
      .then(function (data) {
        var posts = Array.isArray(data.posts) ? data.posts : [];
        var slug = getSlug();
        var post = posts.find(function (item) {
          return item.slug === slug;
        }) || posts[0];

        if (!post) {
          renderNotFound();
          return;
        }

        render(post, posts);
      })
      .catch(function () {
        renderNotFound();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
