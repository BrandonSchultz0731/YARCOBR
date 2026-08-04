# YARCOBR Market Reports

Plain HTML/CSS/JS site for GitHub Pages. No build step to run locally — but
this repo does use one small GitHub Action to keep the report list in sync
automatically. See below.

## Structure

```
index.html                          Home page
market-reports.html                 Archive of all reports (auto-generated)
report.html                         Individual report page — reads ?month=2026-08 from the URL
community-pulse.html                Survey results
about.html                          About Daniel & Matt + Contact (#contact section)
styles.css                          Every page's colors, fonts, and component styles
js/components.js                    Shared header/nav + footer, injected into every page
js/reports-loader.js                Fetches reports.json and provides lookup helpers
reports.json                        Auto-generated. Do not edit by hand — see below.
reports/                            Monthly report PDFs. Non-technical admins work here.
survey/                             Survey result PDFs
scripts/generate-reports-json.js    Builds reports.json from whatever is in /reports
.github/workflows/update-report-index.yml   Runs the script above automatically
```

## How new reports get published (fully automatic)

Anyone with upload access to the repo — no coding needed:

1. Go to the `reports` folder on GitHub.
2. **Add file → Upload files**, drag in the PDF.
3. Name it exactly `YYYY-MM.pdf` (e.g. `2026-09.pdf`).
4. Commit.

A GitHub Action (`.github/workflows/update-report-index.yml`) then runs
automatically, scans `/reports`, rebuilds `reports.json`, and commits it back.
The home page, archive page, and individual report pages all read from that
file at runtime — so within about a minute of the upload, the new report is
live everywhere on the site with no one editing any code.

Deleting a PDF from `/reports` and committing removes it from the site the
same way.

**Filenames that don't match `YYYY-MM.pdf` are simply skipped** (logged as a
warning in the Action's run log) rather than breaking the site — a typo in a
filename can't take the whole site down.

### One-time setup this requires

For the Action to be able to commit `reports.json` back to the repo:
**Settings → Actions → General → Workflow permissions → set to "Read and
write permissions"**, then Save. Without this, the Action will run but fail
to push the update.

## The link to use in Mailchimp

For the "View Market Report" email button, link **directly to the PDF file**:

```
https://yourusername.github.io/reports/2026-08.pdf
```

This opens the PDF immediately in the browser's native viewer — no extra
click, no Google Docs interface. The `report.html?month=2026-08` page (with
the embedded preview, prev/next navigation, etc.) is there for people
browsing the site itself.

## Testing locally

Because the pages now fetch `reports.json` with JavaScript, opening the HTML
files by double-clicking them (`file://...`) will NOT load the report list —
browsers block that for security. Instead, run a tiny local server from the
project folder:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000` in your browser. (This limitation doesn't
apply once it's live on GitHub Pages — only to local testing.)

## Compressing PDFs

GitHub warns above 50MB and hard-blocks above 100MB. A 5–7 page report should
realistically be 1–5MB. If yours is much larger, the images inside it are
probably too high-resolution — compress with:

- [Smallpdf](https://smallpdf.com/compress-pdf) or [iLovePDF](https://www.ilovepdf.com/compress_pdf)
- Mac Preview: File → Export → Quartz Filter → Reduce File Size
- Adobe Acrobat: File → Save As Other → Reduced Size PDF

## Colors & fonts

All brand values live at the top of `styles.css` as CSS variables
(`--color-navy`, `--color-gold`, `--font-heading`, etc.). Change a value
there and every page updates.
