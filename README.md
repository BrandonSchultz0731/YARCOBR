# YARCOBR Market Reports

Use https://smallpdf.com/ to compress these large PDFs before uploading them

Plain HTML/CSS/JS site for GitHub Pages. No build step, no framework, no npm install — just push and it's live.

## Structure

```
index.html              Home page
market-reports.html     Archive of all reports (auto-generated from js/reports-data.js)
report.html             Individual report page — reads ?month=2026-08 from the URL
community-pulse.html    Survey results
about.html              About Daniel & Matt + Contact (contact is the #contact section)
styles.css              Every page's colors, fonts, and component styles — edit once, applies everywhere
js/components.js        Shared header/nav + footer, injected into every page
js/reports-data.js      The list of monthly reports — THE ONLY FILE YOU EDIT EACH MONTH
reports/                Monthly report PDFs (2026-08.pdf, 2026-07.pdf, ...)
survey/                 Survey result PDFs
```

## Monthly workflow

1. Export & **compress** your report PDF (aim under ~5MB — see note below).
2. Upload it to `/reports`, named `YYYY-MM.pdf` (e.g. `2026-09.pdf`).
3. Open `js/reports-data.js` and add one new object to the top of the `REPORTS` array.
4. Commit + push.

That's it — the home page's "latest report" panel, the archive page, and the individual report page (with working prev/next links) all update automatically.

## The link to use in Mailchimp

For the "View Market Report" email button, link **directly to the PDF file**:

```
https://yourusername.github.io/reports/2026-08.pdf
```

This opens the PDF immediately in the browser's native viewer — no extra click, no Google Docs interface. The `report.html?month=2026-08` page (with the embedded preview, prev/next navigation, etc.) is there for people browsing the site itself, but the raw PDF link is the most reliable "one click, opens instantly" experience for the email.

## Compressing PDFs

GitHub warns above 50MB and hard-blocks above 100MB. A 5–7 page report should realistically be 1–5MB. If yours is much larger, the images inside it are probably too high-resolution — compress with:

- [Smallpdf](https://smallpdf.com/compress-pdf) or [iLovePDF](https://www.ilovepdf.com/compress_pdf) (free, no install)
- Mac Preview: File → Export → Quartz Filter → Reduce File Size
- Adobe Acrobat: File → Save As Other → Reduced Size PDF

## Colors & fonts

All brand values live at the top of `styles.css` as CSS variables (`--color-navy`, `--color-gold`, `--font-heading`, etc.). Change a value there and every page updates.
