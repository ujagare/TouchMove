/* Main JS: shared interactions and motion */
(function () {
  "use strict";

  var gsapLoader = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }

        existing.addEventListener(
          "load",
          function () {
            existing.dataset.loaded = "true";
            resolve();
          },
          { once: true },
        );
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.addEventListener(
        "load",
        function () {
          script.dataset.loaded = "true";
          resolve();
        },
        { once: true },
      );
      script.addEventListener("error", reject, { once: true });
      document.head.appendChild(script);
    });
  }

  function ensureGsap() {
    if (window.gsap && window.ScrollTrigger) {
      return Promise.resolve();
    }

    if (gsapLoader) {
      return gsapLoader;
    }

    gsapLoader = loadScript("./assets/vendor/gsap.min.js")
      .then(function () {
        return loadScript("./assets/vendor/ScrollTrigger.min.js");
      })
      .then(function () {
        if (window.gsap && window.ScrollTrigger) {
          window.gsap.registerPlugin(window.ScrollTrigger);
        }
      })
      .catch(function () {
        gsapLoader = null;
      });

    return gsapLoader;
  }

  function isInsideUiChrome(element) {
    return !!element.closest(
      "header, footer, #mobileMenu, script, style, noscript",
    );
  }

  function uniqueElements(elements) {
    return elements.filter(function (element, index, list) {
      return !!element && list.indexOf(element) === index;
    });
  }

  function splitElementWords(element) {
    if (!element || element.dataset.wordsSplit === "true") {
      return Array.prototype.slice.call(
        element ? element.querySelectorAll("[data-split-word]") : [],
      );
    }

    var text = element.textContent;
    if (!text || !text.trim()) return [];

    var words = text.trim().split(/\s+/);
    if (!words.length) return [];

    element.textContent = "";
    element.dataset.wordsSplit = "true";

    var fragment = document.createDocumentFragment();

    words.forEach(function (word, index) {
      var wordWrap = document.createElement("span");
      wordWrap.style.display = "inline-block";
      wordWrap.style.overflow = "hidden";
      wordWrap.style.verticalAlign = "top";

      var wordInner = document.createElement("span");
      wordInner.setAttribute("data-split-word", "true");
      wordInner.textContent = word;
      wordInner.style.display = "inline-block";
      wordInner.style.willChange = "transform, opacity, filter";

      wordWrap.appendChild(wordInner);
      fragment.appendChild(wordWrap);

      if (index < words.length - 1) {
        fragment.appendChild(document.createTextNode(" "));
      }
    });

    element.appendChild(fragment);

    return Array.prototype.slice.call(
      element.querySelectorAll("[data-split-word]"),
    );
  }

  function normalizeButtonText(text) {
    return (text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function getButtonTarget(text) {
    if (!text) return null;

    if (text.indexOf("learn more") !== -1) {
      return "about.html";
    }

    if (text.indexOf("explore the work") !== -1) {
      return "services.html";
    }

    if (text.indexOf("begin your journey") !== -1) {
      return "services.html";
    }

    if (
      text.indexOf("book") !== -1 ||
      text.indexOf("request") !== -1 ||
      text.indexOf("consultation") !== -1
    ) {
      return "contact.html";
    }

    return null;
  }

  function isLocalDevelopment() {
    var host = (window.location.hostname || "").toLowerCase();
    return host === "127.0.0.1" || host === "localhost";
  }

  function isHomePage() {
    var path = (window.location.pathname || "").toLowerCase();
    return path === "/" || path.endsWith("/index.html") || path === "/index";
  }

  function prefersNativeTouchScroll() {
    if (typeof window === "undefined") return false;

    var hasTouchPoints =
      typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
    var coarsePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    var isSmallViewport = window.innerWidth <= 991;

    return isSmallViewport && (hasTouchPoints || coarsePointer);
  }

  function initPageLoader() {
    if (document.body.dataset.loaderReady === "true") return;
    if (!isHomePage()) return;

    document.body.dataset.loaderReady = "true";

    var loader = document.createElement("div");
    loader.setAttribute("data-page-loader", "");
    loader.setAttribute("aria-hidden", "true");
    loader.style.position = "fixed";
    loader.style.inset = "0";
    loader.style.zIndex = "10000";
    loader.style.display = "flex";
    loader.style.alignItems = "center";
    loader.style.justifyContent = "center";
    loader.style.background = "#8F7B6B";
    loader.style.transition =
      "transform 0.9s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.45s ease, visibility 0.45s ease";
    loader.style.transform = "translateY(0)";

    var loaderInner = document.createElement("div");
    loaderInner.style.display = "flex";
    loaderInner.style.flexDirection = "column";
    loaderInner.style.alignItems = "flex-end";
    loaderInner.style.justifyContent = "flex-start";
    loaderInner.style.width = "100%";
    loaderInner.style.height = "100%";
    loaderInner.style.padding = "32px";
    loaderInner.style.boxSizing = "border-box";

    var counter = document.createElement("div");
    counter.textContent = "0";
    counter.style.fontFamily =
      '"Inter Tight", "Arial Narrow", "Helvetica Neue", sans-serif';
    counter.style.fontSize = "clamp(10rem, 28vw, 18rem)";
    counter.style.lineHeight = "1";
    counter.style.fontWeight = "600";
    counter.style.letterSpacing = "-0.08em";
    counter.style.color = "transparent";
    counter.style.fontVariantNumeric = "tabular-nums";
    counter.style.padding = "0";
    counter.style.border = "0";
    counter.style.background = "transparent";
    counter.style.borderRadius = "0";
    counter.style.webkitTextStroke = "1px rgba(255,255,255,0.9)";
    counter.style.textStroke = "1px rgba(255,255,255,0.9)";
    counter.style.marginLeft = "auto";

    loaderInner.appendChild(counter);
    loader.appendChild(loaderInner);
    document.body.appendChild(loader);

    var start = null;
    var duration = 2200;

    function tick(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = String(Math.round(eased * 100));

      if (progress < 1) {
        window.requestAnimationFrame(tick);
        return;
      }

      window.setTimeout(function () {
        loader.style.transform = "translateY(-100%)";
        loader.style.opacity = "1";
        document.body.style.overflow = "";

        window.setTimeout(function () {
          loader.style.visibility = "hidden";
          if (loader.parentNode) {
            loader.parentNode.removeChild(loader);
          }
        }, 950);
      }, 280);
    }

    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(tick);
  }

  function initResponsivePolish() {
    if (document.head.querySelector("[data-mobile-polish='true']")) return;

    var style = document.createElement("style");
    style.setAttribute("data-mobile-polish", "true");
    style.textContent = [
      "html, body { overflow-x: hidden; }",
      "img, video { max-width: 100%; height: auto; }",
      "#navbar a[href='index.html'] { display: flex; align-items: center; min-width: 0; }",
      "#navbar a[href='index.html'] img { width: auto !important; object-fit: contain; flex-shrink: 0; }",
      "#navbar a[href='index.html'] .brand-wordmark { white-space: nowrap; line-height: 1; }",
      "@media (max-width: 767px) {",
      "  main, section, footer, header { max-width: 100%; }",
      "  main section, footer { overflow: hidden; }",
      "  main section { scroll-margin-top: 88px; }",
      "  main section[class*='h-screen'], section[class*='h-screen'] { height: auto !important; min-height: calc(100svh - 20px) !important; padding-top: 110px !important; padding-bottom: 48px !important; }",
      "  main section[class*='py-32'], main section[class*='py-40'] { padding-top: 72px !important; padding-bottom: 72px !important; }",
      "  main [class*='px-20'], main [class*='px-24'], footer [class*='px-20'], footer [class*='px-24'] { padding-left: 16px !important; padding-right: 16px !important; }",
      "  main [class*='gap-24'] { gap: 3rem !important; }",
      "  main [class*='gap-20'] { gap: 2.5rem !important; }",
      "  main [class*='gap-16'] { gap: 2rem !important; }",
      "  main [class*='text-9xl'], main [class*='text-8xl'], main [class*='text-7xl'] { font-size: clamp(2.9rem, 14vw, 5rem) !important; line-height: 0.98 !important; }",
      "  main [class*='text-6xl'], main [class*='text-5xl'] { font-size: clamp(2.2rem, 10vw, 3.6rem) !important; line-height: 1.02 !important; }",
      "  main [class*='text-4xl'] { font-size: clamp(1.8rem, 8vw, 2.6rem) !important; line-height: 1.08 !important; }",
      "  main [class*='text-xl'], main [class*='text-lg'] { font-size: 1rem !important; line-height: 1.7 !important; }",
      "  main [class*='tracking-[0.5em]'], main [class*='tracking-[0.4em]'] { letter-spacing: 0.24em !important; }",
      "  main [class*='tracking-[0.3em]'] { letter-spacing: 0.18em !important; }",
      "  main [class*='min-w-[220px]'], main [class*='min-w-[180px]'], main [class*='min-w-[140px]'] { min-width: 100% !important; }",
      "  main [class*='md:grid-cols-2'], main [class*='md:grid-cols-3'], main [class*='md:grid-cols-12'], main [class*='lg:grid-cols-2'], main [class*='lg:grid-cols-3'], main [class*='lg:grid-cols-4'] { grid-template-columns: 1fr !important; }",
      "  main [class*='md:flex-row'], main [class*='lg:flex-row'] { flex-direction: column !important; }",
      "  main [class*='h-96'], main [class*='h-80'], main [class*='h-72'], main [class*='h-[500px]'], main [class*='h-[650px]'], main [class*='h-[800px]'] { height: min(62vw, 360px) !important; }",
      "  main [class*='w-[800px]'], main [class*='h-[800px]'] { width: 320px !important; height: 320px !important; }",
      "  main form button[type='submit'], main form .flex[type='submit'], main button[class*='min-w-[220px]'] { width: 100% !important; }",
      "  footer .grid { grid-template-columns: 1fr !important; }",
      "  footer [class*='gap-14'], footer [class*='gap-16'] { gap: 2rem !important; }",
      "  footer [class*='pt-10'] { padding-top: 2rem !important; }",
      "  #navbar a[href='index.html'] { max-width: calc(100% - 128px) !important; gap: 10px !important; }",
      "  #navbar a[href='index.html'] img { height: 44px !important; max-width: 136px !important; }",
      "  #navbar a[href='index.html'] .brand-wordmark { font-size: 0.8rem !important; letter-spacing: 0.14em !important; }",
      "}",
      "@media (max-width: 480px) {",
      "  main section, footer .max-w-7xl { padding-left: 14px !important; padding-right: 14px !important; }",
      "  main [class*='text-9xl'], main [class*='text-8xl'], main [class*='text-7xl'] { font-size: clamp(2.4rem, 12vw, 4rem) !important; }",
      "  main [class*='text-6xl'], main [class*='text-5xl'] { font-size: clamp(1.95rem, 9vw, 3rem) !important; }",
      "  main [class*='h-96'], main [class*='h-80'], main [class*='h-72'], main [class*='h-[500px]'], main [class*='h-[650px]'], main [class*='h-[800px]'] { height: min(72vw, 300px) !important; }",
      "  #navbar a[href='index.html'] .brand-wordmark { display: none !important; }",
      "}",
    ].join("\n");

    document.head.appendChild(style);
  }

  function initSeoLinkHub() {
    if (document.querySelector("[data-seo-link-hub='true']")) return;

    var footer = document.querySelector("footer");
    if (!footer) return;

    var footerContainer =
      footer.querySelector(".max-w-7xl") ||
      footer.querySelector(".max-w-6xl") ||
      footer.querySelector(".mx-auto");
    var footerBottom = footer.querySelector(".mt-8.flex");

    if (!footerContainer) return;

    if (!document.head.querySelector("[data-seo-link-hub-style='true']")) {
      var style = document.createElement("style");
      style.setAttribute("data-seo-link-hub-style", "true");
      style.textContent = [
        ".tm-seo-link-hub { margin-top: 2rem; padding: 1.25rem 1.5rem; border: 1px solid rgba(158, 137, 118, 0.18); border-radius: 1.25rem; background: rgba(255, 255, 255, 0.5); }",
        ".tm-seo-link-hub__title { margin: 0 0 0.75rem; font-size: 0.95rem; letter-spacing: 0.16em; text-transform: uppercase; color: #7d6b5d; }",
        ".tm-seo-link-hub__text { margin: 0 0 0.9rem; font-size: 0.98rem; line-height: 1.7; color: #5f564f; }",
        ".tm-seo-link-hub__links { display: flex; flex-wrap: wrap; gap: 0.75rem 1rem; }",
        ".tm-seo-link-hub__links a { color: #7d6b5d; text-decoration: none; border-bottom: 1px solid rgba(158, 137, 118, 0.26); padding-bottom: 0.1rem; transition: color 0.2s ease, border-color 0.2s ease; }",
        ".tm-seo-link-hub__links a:hover { color: #3f3b34; border-color: rgba(63, 59, 52, 0.45); }",
        "@media (max-width: 767px) { .tm-seo-link-hub { padding: 1rem; } .tm-seo-link-hub__links { gap: 0.65rem 0.85rem; } }",
      ].join("\n");
      document.head.appendChild(style);
    }

    var currentPath = (window.location.pathname || "").toLowerCase();
    var links = [
      { href: "index.html", text: "Embodied healing home" },
      { href: "about.html", text: "About Touch and Move" },
      { href: "services.html", text: "Healing services and sessions" },
      { href: "why-clients-work-with-us.html", text: "Tarot guidance with Harshaa" },
      { href: "Aproch.html", text: "Our approach and philosophy" },
      { href: "our-Aproch.html", text: "Our healing process" },
      { href: "blog.html", text: "Wellness blog and insights" },
      { href: "contact.html", text: "Book a consultation" },
    ].filter(function (link) {
      return !currentPath.endsWith("/" + link.href.toLowerCase()) &&
        !currentPath.endsWith(link.href.toLowerCase());
    });

    var hub = document.createElement("section");
    hub.setAttribute("data-seo-link-hub", "true");
    hub.setAttribute("aria-label", "Helpful site links");
    hub.className = "tm-seo-link-hub";

    var title = document.createElement("h2");
    title.className = "tm-seo-link-hub__title";
    title.textContent = "Explore More";

    var text = document.createElement("p");
    text.className = "tm-seo-link-hub__text";
    text.textContent =
      "Browse key Touch and Move pages for embodied healing, intuitive guidance, tarot sessions, wellness insights, and consultation support.";

    var linksWrap = document.createElement("div");
    linksWrap.className = "tm-seo-link-hub__links";

    links.forEach(function (link) {
      var anchor = document.createElement("a");
      anchor.href = link.href;
      anchor.textContent = link.text;
      linksWrap.appendChild(anchor);
    });

    hub.appendChild(title);
    hub.appendChild(text);
    hub.appendChild(linksWrap);

    if (footerBottom && footerBottom.parentNode) {
      footerBottom.parentNode.insertBefore(hub, footerBottom);
    } else {
      footerContainer.appendChild(hub);
    }
  }

  function initButtonRouting() {
    var buttons = Array.prototype.slice.call(
      document.querySelectorAll("button"),
    );

    buttons.forEach(function (button) {
      if (
        button.dataset.routeReady === "true" ||
        button.id === "menuToggle" ||
        button.hasAttribute("data-hero-dot") ||
        button.hasAttribute("data-hero-slider-next") ||
        button.type === "submit"
      ) {
        return;
      }

      var target = getButtonTarget(normalizeButtonText(button.textContent));
      if (!target) return;

      button.dataset.routeReady = "true";
      button.style.cursor = "pointer";

      button.addEventListener("click", function () {
        window.location.href = target;
      });
    });
  }

  function initMobileNavbar() {
    var navbar = document.getElementById("navbar");
    if (!navbar) return;

    var navRow = navbar.querySelector("div.w-full");
    var logoLink = navbar.querySelector("a[href='index.html']");
    var logoImage = logoLink ? logoLink.querySelector("img") : null;
    var logoTitle = logoLink ? logoLink.querySelector(".brand-wordmark") : null;
    var controls = navbar.querySelector("button#menuToggle")
      ? navbar.querySelector("button#menuToggle").parentElement
      : null;
    var menuToggle = document.getElementById("menuToggle");
    var line1 = document.getElementById("line1");
    var line2 = document.getElementById("line2");
    var bookNowLink = controls
      ? controls.querySelector("a[href='contact.html']")
      : null;
    var mobileMenu = document.getElementById("mobileMenu");
    var menuInner = mobileMenu ? mobileMenu.firstElementChild : null;
    var menuLinks = mobileMenu
      ? Array.prototype.slice.call(mobileMenu.querySelectorAll("a"))
      : [];

    function applyNavbarLayout() {
      var isMobile = window.innerWidth <= 640;
      var isNarrow = window.innerWidth <= 380;

      if (navRow) {
        navRow.style.padding = isMobile ? "14px 16px" : "24px 24px";
        navRow.style.alignItems = "center";
      }

      if (logoLink) {
        logoLink.style.display = "flex";
        logoLink.style.alignItems = "center";
        logoLink.style.gap = isMobile ? "10px" : "12px";
        logoLink.style.maxWidth = isMobile ? "calc(100% - 128px)" : "calc(100% - 180px)";
        logoLink.style.minWidth = "0";
        logoLink.style.flex = "0 1 auto";
      }

      if (logoImage) {
        logoImage.style.display = "block";
        logoImage.style.width = "auto";
        logoImage.style.height = isMobile ? "44px" : "56px";
        logoImage.style.maxWidth = isMobile ? "136px" : "172px";
        logoImage.style.objectFit = "contain";
        logoImage.style.flexShrink = "0";
      }

      if (logoTitle) {
        logoTitle.style.fontSize = isMobile ? "0.8rem" : "0.98rem";
        logoTitle.style.letterSpacing = isMobile ? "0.14em" : "0.18em";
        logoTitle.style.display = isNarrow ? "none" : "";
        logoTitle.style.whiteSpace = "nowrap";
        logoTitle.style.lineHeight = "1";
        logoTitle.style.flex = "0 1 auto";
        logoTitle.style.minWidth = "0";
      }

      if (controls) {
        controls.style.gap = isMobile ? "10px" : "16px";
        controls.style.flexShrink = "0";
      }

      if (menuToggle) {
        menuToggle.style.width = isMobile ? "40px" : "44px";
        menuToggle.style.height = isMobile ? "40px" : "44px";
        menuToggle.style.gap = isMobile ? "6px" : "8px";
      }

      if (line1 && line2) {
        line1.style.width = isMobile ? "26px" : "32px";
        line2.style.width = isMobile ? "26px" : "32px";
      }

      if (bookNowLink) {
        bookNowLink.style.padding = isMobile ? "9px 14px" : "10px 24px";
        bookNowLink.style.fontSize = isMobile ? "9px" : "10px";
        bookNowLink.style.letterSpacing = isMobile ? "1.5px" : "2px";
        bookNowLink.style.whiteSpace = "nowrap";
      }

      if (mobileMenu) {
        mobileMenu.style.padding = isMobile ? "96px 24px 32px" : "";
        mobileMenu.style.boxSizing = "border-box";
        mobileMenu.style.overflowY = "auto";
      }

      if (menuInner) {
        menuInner.style.width = isMobile ? "100%" : "";
        menuInner.style.maxWidth = isMobile ? "320px" : "";
        menuInner.style.gap = isMobile ? "22px" : "32px";
      }

      menuLinks.forEach(function (link) {
        link.style.fontSize = isMobile ? "18px" : "22px";
        link.style.lineHeight = isMobile ? "1.3" : "";
      });
    }

    applyNavbarLayout();
    window.addEventListener("resize", applyNavbarLayout);
  }

  function initGsapEffects() {
    if (
      !window.gsap ||
      !window.ScrollTrigger ||
      document.body.dataset.gsapReady === "true"
    ) {
      return;
    }

    document.body.dataset.gsapReady = "true";

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;

    if (window.lenis && !window.lenisScrollTriggerBound) {
      window.lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.lagSmoothing(0);
      window.lenisScrollTriggerBound = true;
    }

    var textTargets = uniqueElements(
      Array.prototype.slice
        .call(
          document.querySelectorAll(
            "section h1, section h2, section h3, section h4, section p, section li, section blockquote",
          ),
        )
        .filter(function (element) {
          return !isInsideUiChrome(element);
        }),
    );

    textTargets.forEach(function (element, index) {
      var isAlreadyVisible =
        element.getBoundingClientRect().top < window.innerHeight * 0.9;
      var isHeadingLike = /^(H1|H2|H3|H4|BLOCKQUOTE)$/.test(element.tagName);
      var hasComplexMarkup = !!element.querySelector("br, em, strong, a, span");
      var isPremiumText = isHeadingLike && !hasComplexMarkup;

      if (isPremiumText) {
        var words = splitElementWords(element);

        if (words.length) {
          gsap.set(words, {
            opacity: 0,
            yPercent: 115,
            force3D: true,
          });

          var premiumConfig = {
            opacity: 1,
            yPercent: 0,
            duration: 1.1,
            stagger: 0.045,
            delay: Math.min(index * 0.018, 0.14),
            ease: "power4.out",
            force3D: true,
          };

          if (isAlreadyVisible) {
            premiumConfig.delay = 0.04;
            gsap.to(words, premiumConfig);
            return;
          }

          premiumConfig.scrollTrigger = {
            trigger: element,
            start: "top 86%",
            once: true,
          };

          gsap.to(words, premiumConfig);
          return;
        }
      }

      if (isHeadingLike) {
        gsap.set(element, {
          opacity: 0,
          y: 54,
          willChange: "transform, opacity",
          force3D: true,
        });

        var headingConfig = {
          opacity: 1,
          y: 0,
          duration: 1.05,
          delay: Math.min(index * 0.018, 0.12),
          ease: "power4.out",
          force3D: true,
        };

        if (isAlreadyVisible) {
          headingConfig.delay = 0.04;
          gsap.to(element, headingConfig);
          return;
        }

        headingConfig.scrollTrigger = {
          trigger: element,
          start: "top 88%",
          once: true,
        };

        gsap.to(element, headingConfig);
        return;
      }

      gsap.set(element, {
        opacity: 0,
        y: 30,
        willChange: "transform, opacity",
        force3D: true,
      });

      var animationConfig = {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: Math.min(index * 0.02, 0.16),
        ease: "power3.out",
        force3D: true,
      };

      if (isAlreadyVisible) {
        animationConfig.delay = 0.05;
        gsap.to(element, animationConfig);
        return;
      }

      animationConfig.scrollTrigger = {
        trigger: element,
        start: "top 88%",
        once: true,
      };

      gsap.to(element, animationConfig);
    });

    var imageTargets = uniqueElements(
      Array.prototype.slice
        .call(document.querySelectorAll("section img, [data-hero-slider] img"))
        .filter(function (image) {
          return !isInsideUiChrome(image) && !image.closest("header");
        }),
    );

    imageTargets.forEach(function (image) {
      image.style.willChange = "transform, opacity";
      image.style.backfaceVisibility = "hidden";
      image.style.transform = "translateZ(0)";

      if (!image.closest("[data-hero-slider]")) {
        gsap.set(image, {
          opacity: 0,
          y: 24,
          scale: 1.03,
          force3D: true,
        });

        gsap.to(image, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          force3D: true,
          scrollTrigger: {
            trigger: image,
            start: "top 90%",
            once: true,
          },
        });
      }

    });

    var hoverTargets = uniqueElements(
      Array.prototype.slice
        .call(
          document.querySelectorAll(
            "a, button, section article, section .premium-blur, section [class*='rounded-']",
          ),
        )
        .filter(function (element) {
          return !isInsideUiChrome(element);
        }),
    );

    hoverTargets.forEach(function (element) {
      var hasImage = !!element.querySelector("img");
      var isTextLink = element.tagName === "A" && !hasImage;
      var yOffset = isTextLink ? -2 : -8;
      var scaleValue = hasImage || element.tagName === "BUTTON" ? 1.01 : 1;

      element.addEventListener("mouseenter", function () {
        gsap.to(element, {
          y: yOffset,
          scale: scaleValue,
          duration: 0.28,
          ease: "power2.out",
          overwrite: "auto",
        });
      });

      element.addEventListener("mouseleave", function () {
        gsap.to(element, {
          y: 0,
          scale: 1,
          duration: 0.32,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    });

    ScrollTrigger.refresh();
  }

  function initHeroSlider() {
    var heroSlider = document.querySelector("[data-hero-slider]");
    if (!heroSlider || heroSlider.dataset.sliderReady === "true") return;

    var slides = Array.prototype.slice.call(
      heroSlider.querySelectorAll("[data-hero-slide]"),
    );
    var dots = Array.prototype.slice.call(
      heroSlider.querySelectorAll("[data-hero-dot]"),
    );
    var count = heroSlider.querySelector("[data-hero-slider-count]");
    var nextButton = heroSlider.querySelector("[data-hero-slider-next]");
    var activeIndex = 0;
    var autoplayId = null;

    if (!slides.length) return;

    heroSlider.dataset.sliderReady = "true";

    function renderSlide(index) {
      activeIndex = index;

      slides.forEach(function (slide, slideIndex) {
        var isActive = slideIndex === activeIndex;
        slide.style.opacity = isActive ? "1" : "0";
        slide.style.pointerEvents = isActive ? "auto" : "none";
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
        slide.classList.toggle("opacity-100", isActive);
        slide.classList.toggle("opacity-0", !isActive);
        slide.classList.toggle("pointer-events-none", !isActive);
      });

      dots.forEach(function (dot, dotIndex) {
        var isActive = dotIndex === activeIndex;
        dot.classList.toggle("w-10", isActive);
        dot.classList.toggle("w-2", !isActive);
        dot.classList.toggle("bg-white", isActive);
        dot.classList.toggle("bg-white/35", !isActive);
        dot.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      if (count) {
        count.textContent =
          String(activeIndex + 1).padStart(2, "0") +
          " / " +
          String(slides.length).padStart(2, "0");
      }
    }

    function goToSlide(index) {
      var nextIndex = index;
      if (nextIndex < 0) nextIndex = slides.length - 1;
      if (nextIndex >= slides.length) nextIndex = 0;
      renderSlide(nextIndex);
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayId = window.setInterval(function () {
        goToSlide(activeIndex + 1);
      }, 4500);
    }

    function stopAutoplay() {
      if (autoplayId !== null) {
        window.clearInterval(autoplayId);
        autoplayId = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        goToSlide(Number(dot.getAttribute("data-hero-dot")));
        startAutoplay();
      });
    });

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        goToSlide(activeIndex + 1);
        startAutoplay();
      });
    }

    heroSlider.addEventListener("mouseenter", stopAutoplay);
    heroSlider.addEventListener("mouseleave", startAutoplay);

    renderSlide(0);
    startAutoplay();
  }

  function smoothScrollTo(target, options) {
    var scrollTarget = target;
    var scrollOptions = options || {};
    var prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (
      !prefersReduced &&
      window.lenis &&
      typeof window.lenis.scrollTo === "function"
    ) {
      var lenisOptions = Object.assign(
        {
          duration: 0.7,
          lock: true,
        },
        scrollOptions,
      );

      window.lenis.scrollTo(scrollTarget, lenisOptions);
      return true;
    }

    if (typeof scrollTarget === "number") {
      window.scrollTo({
        top: scrollTarget,
        behavior: prefersReduced ? "auto" : "smooth",
      });
      return true;
    }

    if (scrollTarget && typeof scrollTarget.scrollIntoView === "function") {
      scrollTarget.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: scrollOptions.block || "start",
      });
      return true;
    }

    return false;
  }

  function initScrollProgress() {
    if (document.querySelector("[data-scroll-progress]")) {
      return;
    }

    var progress = document.createElement("div");
    progress.setAttribute("data-scroll-progress", "true");
    progress.className = "tm-scroll-progress";

    var glow = document.createElement("span");
    glow.className = "tm-scroll-progress__glow";

    var bar = document.createElement("span");
    bar.className = "tm-scroll-progress__bar";

    progress.appendChild(glow);
    progress.appendChild(bar);
    document.body.appendChild(progress);

    var updateProgress = function () {
      var root = document.documentElement;
      var limit = root.scrollHeight - window.innerHeight;
      var ratio = limit > 0 ? Math.min(Math.max(window.scrollY / limit, 0), 1) : 0;

      bar.style.transform = "scaleX(" + ratio + ")";
      glow.style.opacity = ratio > 0.02 ? "1" : "0";
      glow.style.transform = "translateX(" + ratio * 100 + "%)";
    };

    updateProgress();

    if (window.lenis && typeof window.lenis.on === "function") {
      window.lenis.on("scroll", updateProgress);
    } else {
      window.addEventListener("scroll", updateProgress, { passive: true });
    }

    window.addEventListener("resize", updateProgress);
  }

  function initSite() {
    document.documentElement.style.scrollBehavior = "auto";

    initResponsivePolish();
    initPageLoader();
    initSeoLinkHub();

    if (
      typeof window !== "undefined" &&
      typeof window.Lenis === "function" &&
      !window.lenis
    ) {
      var prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      var useNativeTouchScroll = prefersNativeTouchScroll();

      if (!prefersReducedMotion && !useNativeTouchScroll) {
        var lenis = new window.Lenis({
          duration: 1.05,
          easing: function (t) {
            return Math.min(1, 1.001 - Math.pow(2, -9 * t));
          },
          smoothWheel: true,
          wheelMultiplier: 0.9,
          autoRaf: true,
        });
        window.lenis = lenis;
      } else {
        document.documentElement.style.scrollBehavior = "smooth";
      }
    } else {
      document.documentElement.style.scrollBehavior = "smooth";
    }

    window.tmSmoothScrollTo = smoothScrollTo;
    initScrollProgress();

    document.addEventListener("submit", function (e) {
      var form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      var submit = form.querySelector(
        "button[type='submit'], input[type='submit']",
      );
      if (submit) {
        submit.setAttribute("disabled", "disabled");
        submit.setAttribute("aria-disabled", "true");
      }
    });

    document.addEventListener("click", function (e) {
      var link = e.target.closest("a[href^='#']");
      if (!link) return;
      var hash = link.getAttribute("href");
      if (!hash || hash.length < 2) return;
      var target = document.getElementById(hash.slice(1));
      if (!target) return;

      e.preventDefault();

      smoothScrollTo(target, { offset: 0, block: "start" });
      history.pushState(null, "", hash);
    });

    initMobileNavbar();
    initHeroSlider();
    initButtonRouting();

    ensureGsap().then(function () {
      initGsapEffects();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSite, { once: true });
  } else {
    initSite();
  }
})();

