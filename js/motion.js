/* ==========================================================================
   Motion layer — scroll reveals, the scroll indicator, and the header's
   scrolled state.

   Loaded from <head> WITHOUT defer, on purpose. It flags the document as
   animation-capable while the page is still parsing, so elements that are
   going to fade in are already hidden before they paint. Deferring it would
   show every section, then hide it, then fade it back in.

   Nothing here is required for the site to work. With JavaScript off, or with
   "reduce motion" set at the OS level, the .js-motion flag is never added and
   every .reveal element is simply visible — the CSS only hides them inside
   .js-motion. Content can never get stranded at opacity 0.
   ========================================================================== */

(function () {
  "use strict";

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var root = document.documentElement;
  if (!reduced) root.classList.add("js-motion");

  /* ---- Scroll reveal -----------------------------------------------------
     Anything marked .reveal fades and rises once a little of it is on screen.
     Children of a [data-stagger] container are numbered so they arrive one
     after another instead of all at once. */
  var observer = null;

  function stagger(container) {
    var kids = container.children;
    for (var i = 0; i < kids.length; i++) {
      if (!kids[i].style.getPropertyValue("--i")) {
        kids[i].style.setProperty("--i", String(i));
      }
      kids[i].classList.add("reveal");
    }
  }

  function scan(within) {
    var scope = within || document;

    var groups = scope.querySelectorAll("[data-stagger]");
    for (var g = 0; g < groups.length; g++) stagger(groups[g]);

    // No observer support (or reduced motion): show everything immediately.
    if (reduced || !("IntersectionObserver" in window)) {
      var all = scope.querySelectorAll(".reveal");
      for (var a = 0; a < all.length; a++) all[a].classList.add("is-in");
      return;
    }

    if (!observer) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            // One-way: once something has arrived it stays. Re-animating on
            // the way back up is the kind of effect that makes a page tiring
            // to read a second time.
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
      );
    }

    var pending = scope.querySelectorAll(".reveal:not(.is-in)");
    for (var p = 0; p < pending.length; p++) observer.observe(pending[p]);
  }

  /* ---- Scroll indicator -------------------------------------------------
     Only the progress bar lives here. The header's own scrolled state is
     deliberately NOT in this file: it decides whether the bar is transparent
     with white text or solid with dark text, so getting it wrong makes the
     navigation unreadable. It is owned by components.js, which is the file
     that renders the header in the first place — so the two can never be
     present without each other. */
  function initScroll() {
    var tide = document.createElement("div");
    tide.className = "scroll-tide";
    tide.setAttribute("aria-hidden", "true");
    document.body.appendChild(tide);

    var ticking = false;

    function update() {
      ticking = false;
      var y = window.pageYOffset || root.scrollTop || 0;
      var max = Math.max(1, root.scrollHeight - window.innerHeight);
      tide.style.setProperty("--progress", String(Math.min(1, y / max)));
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  function init() {
    scan();
    initScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Pages that build markup from reports.json call this after rendering, so
  // cards that did not exist at load still animate in.
  window.Motion = { scan: scan, reduced: reduced };
})();
