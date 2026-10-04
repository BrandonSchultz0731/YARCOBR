/**
 * Makes URLs written in a report PDF actually clickable.
 *
 * Illustrator has no way to add a hyperlink, so the reports carry the survey
 * URL as plain text hidden behind the button instead. Desktop Chrome guesses a
 * link from text like that; phones, Safari, and the PDF.js viewer on
 * /report do not. This finds every http(s) URL in the PDF's text and adds a
 * real link annotation over it, so the button works everywhere.
 *
 * Usage (once: `npm install`):
 *
 *   node scripts/add-pdf-links.mjs reports/2026-10.pdf            edits in place
 *   node scripts/add-pdf-links.mjs reports/2026-10.pdf --dry-run  only reports
 *
 * Safe to run more than once: a URL that already has a link at the same spot
 * is skipped. Run it on the final PDF, after compressing — some compressors
 * drop links.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, PDFName, PDFString, PDFArray, PDFDict } from "pdf-lib";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// The same PDF.js the site vendors, so the script needs no second copy.
const LIB = path.join(ROOT, "js", "vendor", "pdf.min.mjs");
const WORKER = path.join(ROOT, "js", "vendor", "pdf.worker.min.mjs");

// Stops at whitespace and at characters that cannot end a URL in prose.
const URL_RE = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]]/gi;

// Two link rectangles closer than this (in PDF points) count as the same one.
const SAME_RECT = 2;

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
async function findUrls(bytes) {
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

function existingLinks(page) {
  const annots = page.node.lookup(PDFName.of("Annots"));
  if (!(annots instanceof PDFArray)) return [];
  const out = [];
  for (let i = 0; i < annots.size(); i++) {
    const a = annots.lookup(i);
    if (!(a instanceof PDFDict)) continue;
    if (a.get(PDFName.of("Subtype")) !== PDFName.of("Link")) continue;
    const action = a.lookup(PDFName.of("A"));
    const uri = action instanceof PDFDict && action.lookup(PDFName.of("URI"));
    const rect = a.lookup(PDFName.of("Rect"));
    if (!uri || !(rect instanceof PDFArray)) continue;
    out.push({
      url: uri.decodeText(),
      rect: rect.asArray().map((v) => v.asNumber()),
    });
  }
  return out;
}

function sameRect(r1, r2) {
  return r1.every((v, i) => Math.abs(v - r2[i]) < SAME_RECT);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("Usage: node scripts/add-pdf-links.mjs <file.pdf> [--dry-run]");
    process.exit(1);
  }

  const bytes = fs.readFileSync(file);
  // PDF.js takes ownership of the buffer it is given, so hand it a copy.
  const urls = await findUrls(new Uint8Array(bytes));
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();

  let added = 0;
  for (const u of urls) {
    const page = pages[u.page - 1];
    const rect = u.rect.map((v) => Math.round(v * 100) / 100);
    const label = `page ${u.page}: ${u.url}`;

    if (existingLinks(page).some((l) => l.url === u.url && sameRect(l.rect, rect))) {
      console.log(`already linked  ${label}`);
      continue;
    }

    console.log(`${dryRun ? "would link" : "linked"}      ${label}`);
    console.log(`                at [${rect.join(", ")}]`);
    if (dryRun) continue;

    const annot = doc.context.register(
      doc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: rect,
        // No visible border around the button.
        Border: [0, 0, 0],
        A: { Type: "Action", S: "URI", URI: PDFString.of(u.url) },
      }),
    );
    page.node.addAnnot(annot);
    added++;
  }

  if (!urls.length) {
    console.log("No http(s) URLs found in the PDF's text. Nothing to link.");
    return;
  }
  if (!added) return;

  const out = await doc.save({ useObjectStreams: true });
  fs.writeFileSync(file, out);
  console.log(
    `\nSaved ${file} with ${added} new link${added === 1 ? "" : "s"} ` +
      `(${(bytes.length / 1024).toFixed(0)} KB -> ${(out.length / 1024).toFixed(0)} KB).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
