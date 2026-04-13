(function () {
  "use strict";

  function goToPost(slug) {
    if (!slug) return;
    window.location.href = "blog/" + encodeURIComponent(slug) + ".html";
  }

  function bindCard(card) {
    if (!card) return;
    var slug = card.getAttribute("data-slug");
    if (!slug) return;

    card.style.cursor = "pointer";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "link");

    card.addEventListener("click", function (event) {
      var interactive = event.target.closest("a, button");
      if (interactive) return;
      goToPost(slug);
    });

    card.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        goToPost(slug);
      }
    });
  }

  function init() {
    Array.prototype.slice
      .call(document.querySelectorAll("[data-blog-card]"))
      .forEach(bindCard);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
