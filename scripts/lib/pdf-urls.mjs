/**
 * Finds the http(s) URLs written in a PDF's text, with where they sit on the
 * page. Shared by scripts/add-pdf-links.mjs (which links them) and
 * scripts/generate-reports-json.js (which lists a report's survey link).
 *
 * Reads only. Needs nothing from npm: it uses the PDF.js the site vendors.
 */
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// The same PDF.js the site vendors, so the script needs no second copy.
const LIB = path.join(ROOT, "js", "vendor", "pdf.min.mjs");
const WORKER = path.join(ROOT, "js", "vendor", "pdf.worker.min.mjs");

// Stops at whitespace and at characters that cannot end a URL in prose.
const URL_RE = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]]/gi;

async function loadPdfjs() {
  // PDF.js warns at import time about canvas support it only needs for
  // drawing. This script only reads text, so keep the output readable.
  const warn = console.warn;
  const log = console.log;
  console.warn = console.log = () => {};
  try {
    const pdfjs = await import(LIB);
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER;
    return pdfjs;
  } finally {
    console.warn = warn;
    console.log = log;
  }
}

/**
 * Every URL on every page, with its rectangle in PDF coordinates
 * ([x1, y1, x2, y2], origin bottom-left). A URL split across several text
 * items is still found, because the items are joined before matching.
 */
export async function findUrls(bytes) {
  const pdfjs = await loadPdfjs();
  const task = pdfjs.getDocument({ data: bytes, verbosity: 0 });
  const pdf = await task.promise;
  const found = [];

  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const { items } = await page.getTextContent();

    // Join the page's text, remembering where each item starts.
    let text = "";
    const spans = [];
    for (const it of items) {
      if (!("str" in it)) continue;
      spans.push({ it, start: text.length, end: text.length + it.str.length });
      text += it.str + (it.hasEOL ? "\n" : "");
    }

    for (const m of text.matchAll(URL_RE)) {
      const from = m.index;
      const to = m.index + m[0].length;
      let rect = null;

      for (const s of spans) {
        if (s.end <= from || s.start >= to || !s.it.str.length) continue;
        const [a, b, , , e, f] = s.it.transform;
        // Only horizontal text is handled; that is all the reports use.
        if (Math.abs(b) > 1e-6 || a <= 0) continue;
        // Within one item, assume evenly spaced characters, so a URL in the
        // middle of a sentence gets a box around the URL and not the line.
        const len = s.it.str.length;
        const x1 = e + (s.it.width * Math.max(0, from - s.start)) / len;
        const x2 = e + (s.it.width * (Math.min(len, to - s.start))) / len;
        const r = [x1, f, x2, f + s.it.height];
        rect = rect
          ? [
              Math.min(rect[0], r[0]),
              Math.min(rect[1], r[1]),
              Math.max(rect[2], r[2]),
              Math.max(rect[3], r[3]),
            ]
          : r;
      }

      if (rect) found.push({ page: n, url: m[0], rect });
    }
  }

  await task.destroy();
  return found;
}
