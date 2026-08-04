/* ==========================================================================
   Shared header + footer, injected into every page.
   Edit this file once (e.g. to add a nav link) and every page updates.
   Usage in a page:
     <div id="site-header"></div>
     ...
     <div id="site-footer"></div>
     <script src="js/components.js"></script>
     <script>renderHeader('home'); renderFooter();</script>
   Pass the current page's key as the argument to renderHeader so the
   matching nav link gets the "active" underline.
   ========================================================================== */

const SAILBOAT_ICON = `
<svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 4V22" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M16 6L24 18C21.7 19.3 18.9 20 16 20C13.1 20 10.3 19.3 8 18L16 6Z" fill="currentColor" opacity="0.9"/>
  <path d="M5 24C7 26 10 27 16 27C22 27 25 26 27 24" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

const NAV_LINKS = [
  { key: "home", label: "Home", href: "index.html" },
  { key: "reports", label: "Market Reports", href: "market-reports.html" },
  { key: "pulse", label: "Community Pulse", href: "community-pulse.html" },
  { key: "about", label: "About", href: "about.html" },
  { key: "contact", label: "Contact", href: "about.html#contact" },
];

function renderHeader(activeKey, options) {
  const mount = document.getElementById("site-header");
  if (!mount) return;
  const dark = options && options.dark;

  const links = NAV_LINKS.map(function (link) {
    const activeClass = link.key === activeKey ? " active" : "";
    return `<a href="${link.href}" class="${activeClass.trim()}">${link.label}</a>`;
  }).join("");

  mount.innerHTML = `
    <header class="site-header">
      <div class="container">
        <a href="index.html" class="brand">
          <span style="color: var(--color-navy);">${SAILBOAT_ICON}</span>
          <span class="brand-text">
            <span class="brand-name">YARCOBR</span>
            <span class="brand-sub">Market Reports</span>
          </span>
        </a>
        <nav class="main-nav" id="main-nav">${links}</nav>
        <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="#0A1D37" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
    </header>
  `;

  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }
}

function renderFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  const year = new Date().getFullYear();

  mount.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <a href="index.html" class="brand">
          <span style="color: var(--color-white);">${SAILBOAT_ICON}</span>
          <span class="brand-text">
            <span class="brand-name">YARCOBR Market Reports</span>
          </span>
        </a>
        <nav class="footer-nav">
          <a href="index.html">Home</a>
          <a href="market-reports.html">Market Reports</a>
          <a href="community-pulse.html">Community Pulse</a>
          <a href="about.html">About</a>
          <a href="about.html#contact">Contact</a>
        </nav>
      </div>
    </footer>
  `;
}
