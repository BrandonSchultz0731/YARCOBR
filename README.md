# YARCOBR Market Reports

Plain HTML/CSS/JS site for GitHub Pages. No build step to run locally — but
this repo does use one small GitHub Action to keep the report list in sync
automatically. See below.

## Structure

```
index.html                          Home page
market-reports.html                 Archive of all reports (auto-generated, with sort + search)
report.html                         Individual report page — reads ?month=2026-08 from the URL
community-pulse.html                Survey results (see note below — only partly automated)
about.html                          About Us page
contact.html                        Contact Us page (separate from About as of this update)
styles.css                          Every page's colors, fonts, and component styles
js/components.js                    Shared header/nav + footer, injected into every page
js/reports-loader.js                Fetches reports.json and provides lookup helpers
js/survey-loader.js                 Fetches survey.json (PDF link + month label only — see note below)
reports.json / survey.json          Auto-generated. Do not edit by hand — see below.
reports/                            Monthly report PDFs. Non-technical admins work here.
survey/                             Survey result PDFs — same YYYY-MM.pdf convention as /reports
assets/                             Drop daniel.jpg, matt.jpg, chickee-bar.jpg here (see assets/README.md)
scripts/generate-reports-json.js    Builds reports.json from whatever is in /reports
scripts/generate-survey-json.js     Builds survey.json from whatever is in /survey
.github/workflows/update-report-index.yml   Runs both scripts above automatically
```

### Important: Community Pulse automation is partial

Uploading a PDF to `/survey` (named `YYYY-MM.pdf`, same rule as `/reports`)
automatically does two things: it repoints the "View Full Survey Results" and
"Download Survey Report" buttons on `community-pulse.html` at the new file,
and it updates the **month label** on the home page's Community Pulse panel.
Until a PDF exists, those two buttons stay hidden rather than linking to a
missing file.

It does **not** automatically update the actual stats, donut chart
percentages, key takeaways, or AI summary on `community-pulse.html` — those
are specific numbers from each survey that can't be derived from a filename.
Whoever compiles the survey results still needs to edit those directly in
`community-pulse.html` each cycle (there's a comment at the top of that file
marking what to update).

### Contact form

The "Send Us a Message" form on `contact.html` has no backend (GitHub Pages
is static and can't run one) — submitting it opens the visitor's email
client with a pre-filled message to Daniel, rather than silently sending
in the background. This means it only works smoothly for visitors who have
an email client configured on their device.

## How new reports get published (fully automatic)

Anyone with upload access to the repo — no coding needed:

1. Go to the `reports` folder on GitHub.
2. **Add file → Upload files**, drag in the PDF.
3. Name it exactly `YYYY-MM.pdf` (e.g. `2026-09.pdf`).
4. Commit.

A GitHub Action (`.github/workflows/update-report-index.yml`) then runs
automatically, scans `/reports` and `/survey`, rebuilds `reports.json` and
`survey.json`, and commits them back. The home page, archive page, and
individual report pages all read from those files at runtime — so within
about a minute of the upload, the new report is live everywhere on the site
with no one editing any code.

Deleting a PDF from `/reports` and committing removes it from the site the
same way. Survey PDFs work identically — see `survey/README.md`.

**Filenames that don't match `YYYY-MM.pdf` are simply skipped** (logged as a
warning in the Action's run log) rather than breaking the site — a typo in a
filename can't take the whole site down.

### One-time setup this requires

For the Action to be able to commit `reports.json` / `survey.json` back to
the repo: **Settings → Actions → General → Workflow permissions → set to
"Read and write permissions"**, then Save. Without this, the Action will run
but fail to push the update.

### Manual trigger

The workflow includes `workflow_dispatch`, which adds a **Run workflow**
button: Actions tab → "Update Report & Survey Index" → Run workflow. Normal
uploads never need this — it's there for edge cases like the one below.

### Edge case: force-pushing backward

If you force-push `main` back to an older commit (rather than adding a new
commit), GitHub doesn't register any new commits in that push, so the
`paths:` trigger has nothing to evaluate and won't fire — `reports.json`
will be left stale, out of sync with the actual PDFs in
`/reports`. If this happens, use **Run workflow** (above) to force a fresh
regeneration. Prefer making a real forward commit over force-pushing
backward when possible — normal commits always trigger correctly.

## The link to use in Mailchimp

For the "View Market Report" email button, link **directly to the PDF file**
on the live domain:

```
https://liveyarcobr.com/reports/2026-08.pdf
```

Change the `2026-08` to match the month you're sending. Double-check the link
in a browser before sending — this one goes out to the whole community.

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
