/* ==========================================================================
   Inline PDF rendering for devices that cannot display one natively.

   Phones and tablets do not render an embedded PDF. iOS Safari shows a single
   frozen first page; most Android browsers show nothing at all. That left a
   resident on a phone unable to read the monthly report on the page, which is
   the one thing the report page exists to do.

   PDF.js draws each page onto a <canvas>, so no native PDF support is needed.
   See js/vendor/README.md for what is vendored and why.

   Design notes:

   - Pages render into the normal page flow rather than into a scrolling box
     of their own. Nested touch scrolling is miserable, and in normal flow the
     phone's own scrolling and pinch-zoom behave exactly as a reader expects.
   - Pages render lazily, nearest-first. Drawing five full-page canvases at
     once is a real stall on an old iPad, and it is wasted work for anyone who
     reads page one and leaves.
   - Every canvas gets its final height before anything is drawn, so the page
     never jumps under a reader who has already started scrolling.
   - This is loaded on demand. Desktop browsers keep the built-in viewer and
     never download the library.
   - A canvas is only pixels, so links in the PDF are not clickable on their
     own. Each page gets transparent <a> elements laid over the canvas, one
     per link annotation in the PDF. A URL that is only text in the PDF gets
     no link here: desktop Chrome guesses links from text, PDF.js does not,
     so the fix for that is a real hyperlink in the exported PDF.
   ========================================================================== */

(function () {
  "use strict";

  var LIB = "/js/vendor/pdf.min.mjs";
  var WORKER = "/js/vendor/pdf.worker.min.mjs";

  // Canvas pixels per CSS pixel. Retina phones report 3; rendering at 3x a
  // full-width page is a lot of memory for very little visible gain, and it is
  // the kind of thing that makes an older device drop the canvas entirely.
  var MAX_DPR = 2;

  // Only these schemes become tappable. Anything else in a PDF (javascript:,
  // file:, ...) is ignored.
  var SAFE_HREF = /^(https?:|mailto:|tel:)/i;

  var libPromise = null;
  function loadLib() {
    if (!libPromise) {
      // Wrapped in Function() so that browsers without dynamic import fail
      // here, at a point we catch, instead of on a syntax error that would
      // take the whole inline script down with it.
      libPromise = new Function("u", "return import(u)")(LIB).then(
        function (mod) {
          mod.GlobalWorkerOptions.workerSrc = WORKER;
          return mod;
        },
      );
    }
    return libPromise;
  }

  /**
   * Place a link over a rectangle given in PDF coordinates. Positions are
   * percentages of the page, so they survive resizes and rotation without any
   * recalculation. Uses convertToViewportPoint, which exists in PDF.js 6
   * (convertToViewportRectangle does not).
   */
  function placeLink(stage, viewport, x1, y1, x2, y2, href) {
    var p1 = viewport.convertToViewportPoint(x1, y1);
    var p2 = viewport.convertToViewportPoint(x2, y2);
    var x = Math.min(p1[0], p2[0]);
    var y = Math.min(p1[1], p2[1]);
    var w = Math.abs(p2[0] - p1[0]);
    var h = Math.abs(p2[1] - p1[1]);

    var a = document.createElement("a");
    a.className = "pdf-link";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", "Link: " + href);
    a.style.left = (x / viewport.width) * 100 + "%";
    a.style.top = (y / viewport.height) * 100 + "%";
    a.style.width = (w / viewport.width) * 100 + "%";
    a.style.height = (h / viewport.height) * 100 + "%";
    stage.appendChild(a);
  }

  // One overlay per link annotation in the PDF.
  function addLinks(stage, annots, viewport) {
    annots.forEach(function (a) {
      if (a.subtype !== "Link" || !a.rect) return;
      var href = a.url || a.unsafeUrl;
      if (!href || !SAFE_HREF.test(href)) return;
      placeLink(
        stage,
        viewport,
        a.rect[0],
        a.rect[1],
        a.rect[2],
        a.rect[3],
        href,
      );
    });
  }

  /**
   * Render a PDF into `container` as a stack of canvases.
   * Returns a promise that resolves once the document is open and the page
   * boxes are laid out — not once every page has been drawn.
   */
  function renderInto(container, url, options) {
    var opts = options || {};
    var onFail = opts.onFail || function () {};

    return loadLib()
      .then(function (pdfjs) {
        return pdfjs.getDocument({ url: url }).promise;
      })
      .then(function (pdf) {
        container.innerHTML = "";
        container.setAttribute("role", "document");

        var pending = [];

        // First pass: create every page at its true aspect ratio so the
        // document's full height is known immediately and nothing reflows
        // later. Drawing happens in the second pass.
        var chain = Promise.resolve();
        for (var n = 1; n <= pdf.numPages; n++) {
          (function (pageNumber) {
            chain = chain.then(function () {
              return pdf.getPage(pageNumber).then(function (page) {
                var base = page.getViewport({ scale: 1 });
                var wrap = document.createElement("div");
                wrap.className = "pdf-page";

                // The stage is the positioning context for the link overlay,
                // kept separate from the page label so percentages line up
                // with the canvas alone.
                var stage = document.createElement("div");
                stage.className = "pdf-page-stage";

                var canvas = document.createElement("canvas");
                canvas.className = "pdf-page-canvas";
                // Reserve the right height before drawing.
                canvas.style.aspectRatio = base.width + " / " + base.height;
                canvas.setAttribute(
                  "aria-label",
                  "Page " + pageNumber + " of " + pdf.numPages,
                );

                var label = document.createElement("div");
                label.className = "pdf-page-label";
                label.textContent = pageNumber + " / " + pdf.numPages;

                stage.appendChild(canvas);
                wrap.appendChild(stage);
                wrap.appendChild(label);
                container.appendChild(wrap);
                pending.push({ page: page, canvas: canvas, drawn: false });

                // Fire and forget: a failure here must never break page
                // rendering.
                page
                  .getAnnotations({ intent: "display" })
                  .then(function (annots) {
                    addLinks(stage, annots, base);
                  })
                  .catch(function (e) {
                    if (window.console && console.warn) {
                      console.warn("[report] link overlay failed:", e);
                    }
                  });
              });
            });
          })(n);
        }

        return chain.then(function () {
          function draw(item) {
            if (item.drawn) return;
            item.drawn = true;

            var width = item.canvas.clientWidth;
            if (!width) return;

            var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
            var base = item.page.getViewport({ scale: 1 });
            var viewport = item.page.getViewport({
              scale: (width / base.width) * dpr,
            });

            item.canvas.width = Math.floor(viewport.width);
            item.canvas.height = Math.floor(viewport.height);

            item.page.render({
              canvasContext: item.canvas.getContext("2d", { alpha: false }),
              viewport: viewport,
            });
          }

          if ("IntersectionObserver" in window) {
            var io = new IntersectionObserver(
              function (entries) {
                entries.forEach(function (entry) {
                  if (!entry.isIntersecting) return;
                  var item = pending.filter(function (p) {
                    return p.canvas === entry.target;
                  })[0];
                  if (item) draw(item);
                  io.unobserve(entry.target);
                });
              },
              // Start a page early so it is already there by the time it is
              // scrolled to.
              { rootMargin: "150% 0px" },
            );
            pending.forEach(function (item) {
              io.observe(item.canvas);
            });
          } else {
            pending.forEach(draw);
          }

          // Re-draw at the new width after a rotation, otherwise a page drawn
          // in portrait stays soft when the device turns. The link overlays
          // are percentages, so they need no redraw.
          var resizeTimer;
          var lastWidth = container.clientWidth;
          window.addEventListener("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
              if (container.clientWidth === lastWidth) return;
              lastWidth = container.clientWidth;
              pending.forEach(function (item) {
                item.drawn = false;
                draw(item);
              });
            }, 250);
          });

          return pdf.numPages;
        });
      })
      .catch(function (err) {
        // Anything at all — the library failing to load, a corrupt file, a
        // browser without dynamic import. The caller puts the open/download
        // panel back, so the visitor always has a way to read the report.
        if (window.console && console.warn) {
          console.warn("[report] inline PDF rendering unavailable:", err);
        }
        onFail(err);
        return 0;
      });
  }

  window.PdfInline = { renderInto: renderInto };
})();
