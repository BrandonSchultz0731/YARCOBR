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
import { PDFDocument, PDFName, PDFString, PDFArray, PDFDict } from "pdf-lib";
import { findUrls } from "./lib/pdf-urls.mjs";

// Two link rectangles closer than this (in PDF points) count as the same one.
const SAME_RECT = 2;

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
