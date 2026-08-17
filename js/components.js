/* ==========================================================================
   Shared header + footer, injected into every page.
   Edit this file once (e.g. to add a nav link) and every page updates.

   Usage in a page:
     <div id="site-header"></div>
     ...
     <div id="site-footer"></div>
     <script src="js/components.js"></script>
     <script>renderHeader('home'); renderFooter();</script>

   Pass the current page's key as the argument to renderHeader so the matching
   nav link gets the active marker.
   ========================================================================== */

/* The brand mark: three soundings breaking a waterline, with the depth ticks
   below it. It is the same device the rest of the site is built on — the
   labelled hairline that opens each section — reduced to 32px.

   Deliberately not a sailboat. Every marina in Florida already has that logo,
   and this site is about what the numbers say, not about boats. */
const BRAND_MARK = `
<svg class="brand-mark" width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <path class="mark-wave mark-wave-3" d="M4 20.5a12 12 0 0 1 24 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.32"/>
  <path class="mark-wave mark-wave-2" d="M7.8 20.5a8.2 8.2 0 0 1 16.4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  <path class="mark-wave mark-wave-1" d="M11.6 20.5a4.4 4.4 0 0 1 8.8 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M2.5 20.5h27" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M9 23.5v2M16 23.5v3.5M23 23.5v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.45"/>
</svg>`;

const NAV_LINKS = [
  { key: "home", label: "Home", href: "/" },
  { key: "reports", label: "Market Reports", href: "/market-reports" },
  { key: "pulse", label: "Community Pulse", href: "/community-pulse" },
  { key: "about", label: "About Us", href: "/about" },
  { key: "contact", label: "Contact Us", href: "/contact" },
];

function renderHeader(activeKey) {
  const mount = document.getElementById("site-header");
  if (!mount) return;

  const links = NAV_LINKS.map(function (link) {
    const isActive = link.key === activeKey;
    return `<a href="${link.href}"${isActive ? ' class="active" aria-current="page"' : ""}>${link.label}</a>`;
  }).join("");

  // Every page opens on a dark band, so the bar starts transparent and lets
  // the photograph run underneath it. It takes on the paper background once
  // the page has actually scrolled — see .is-scrolled in the stylesheet.
  const overDark = document.querySelector(".hero, .page-head")
    ? " is-over-dark"
    : "";

  mount.innerHTML = `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header${overDark}">
      <div class="container">
        <a href="/" class="brand" aria-label="LiveYARCOBR — home">
          ${BRAND_MARK}
          <span class="brand-text">
            <span class="brand-name">LiveYARCOBR</span>
            <span class="brand-sub">Yacht &amp; Racquet Club</span>
          </span>
        </a>
        <nav class="main-nav" id="main-nav" aria-label="Main">${links}</nav>
        <button class="nav-toggle" id="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="main-nav">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path class="bar bar-1" d="M3 7h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path class="bar bar-2" d="M3 12h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path class="bar bar-3" d="M3 17h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </header>
  `;

  // Whether the bar is glass-over-photo or a solid surface. This lives here
  // rather than in motion.js because it is not decoration: over a light page
  // the transparent state renders white nav links on near-white paper. The
  // header must never depend on another file loading to stay readable.
  //
  // Toggled straight from the scroll event with no requestAnimationFrame
  // throttle — a classList.toggle is far cheaper than a frame, and routing it
  // through rAF meant that if frames were throttled the bar could sit in the
  // wrong state indefinitely.
  const bar = mount.querySelector(".site-header");
  if (bar) {
    const syncBar = function () {
      bar.classList.toggle("is-scrolled", (window.pageYOffset || 0) > 12);
    };
    window.addEventListener("scroll", syncBar, { passive: true });
    // Covers a reload that restores a mid-page scroll position, and any load
    // that arrives with a #hash already applied.
    window.addEventListener("load", syncBar);
    syncBar();
  }

  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  if (!toggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", function () {
    setOpen(!nav.classList.contains("open"));
  });

  // Escape closes the menu and hands focus back to the button that opened it,
  // rather than leaving a keyboard user inside a panel they cannot see.
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Tapping a link to the page you are already on does not navigate, so the
  // menu would otherwise stay open over the content.
  nav.addEventListener("click", function (event) {
    if (event.target.closest("a")) setOpen(false);
  });
}

function renderFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  const year = new Date().getFullYear();

  const links = NAV_LINKS.map(function (link) {
    return `<a href="${link.href}">${link.label}</a>`;
  }).join("");

  mount.innerHTML = `
    <footer class="site-footer">
      <div class="contours" aria-hidden="true"></div>
      <div class="footer-top">
        <a href="/" class="brand" aria-label="LiveYARCOBR — home">
          ${BRAND_MARK}
          <span class="brand-text">
            <span class="brand-name">LiveYARCOBR</span>
            <span class="brand-sub">Boca Raton, Florida</span>
          </span>
        </a>
        <nav class="footer-nav" aria-label="Footer">${links}</nav>
      </div>
      <div class="footer-disclaimer">
        <span>An independent community resource created by YARCOBR residents Daniel Schultz &amp; Matt Gelling. Not affiliated with or endorsed by the Yacht &amp; Racquet Club of Boca Raton Association.</span>
        <span>© ${year} LiveYARCOBR. All rights reserved.</span>
      </div>
    </footer>
  `;
}
