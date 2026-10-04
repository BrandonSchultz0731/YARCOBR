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
js/motion.js                        Scroll reveals, scroll indicator, header scrolled state
js/pdf-inline.js                    Draws report pages on phones (see "Reading the report")
js/vendor/                          Vendored PDF.js — see js/vendor/README.md
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
percentages, key takeaways, or community summary on `community-pulse.html` — those
are specific numbers from each survey that can't be derived from a filename.
Whoever compiles the survey results still needs to edit those directly in
`community-pulse.html` each cycle (there's a comment at the top of that file
marking what to update).

### Contact form

The "Send Us a Message" form on `contact.html` posts to
[Web3Forms](https://web3forms.com), which emails the submission to Daniel.
GitHub Pages is static and can't run a backend, so a third-party service is
what makes the form actually send. It used to open the visitor's email app
instead, which did nothing at all on a device with no mail app set up.

Things worth knowing before changing it:

- **The access key in `contact.html` is public on purpose.** It names the
  destination inbox; it is not a password, and Web3Forms won't let the
  recipient be overridden in the request.
- **Changing who receives submissions means a new key.** A key is permanently
  bound to one email address. Generate another at web3forms.com with the new
  address and swap the `access_key` value — one line.
- **Every field needs a `name`.** Web3Forms reads by `name` and ignores `id`,
  so a field missing one arrives blank _and the submission still reports
  success_. Add a field, give it a `name`.
- **The free tier allows 250 submissions a month** and keeps them for 30 days,
  so the email itself is the only durable record. If it gets spam-filtered the
  lead is gone.
- **`botcheck` is a spam honeypot** — a checkbox hidden by CSS that real
  people never see. Nothing may make it visible.
- The email buttons and "Copy address" beside them are the deliberate fallback
  for when the service is down. Keep them.

Because it can fail quietly, Daniel should send himself a test message through
the form once a quarter. See `docs/contact-form-plan.md`.

### Reading the report

`/report?month=YYYY-MM` shows one report, and the document gets the screen —
a slim toolbar, then the viewer filling the rest of the viewport. It is drawn
one of two ways, decided at runtime:

- **Desktop** uses the browser's own PDF viewer through `<embed>`. It is
  faster, gives a real toolbar and page thumbnails, and downloads nothing
  extra.
- **Phones and tablets** cannot display an embedded PDF — iOS Safari renders a
  single frozen first page, most Android browsers render nothing — so the page
  draws it with PDF.js instead, one `<canvas>` per page. Pages render lazily
  and re-render after a rotation.

The switch is width plus `navigator.pdfViewerEnabled`, re-evaluated when the
viewport crosses the breakpoint so a rotating tablet gets the right one. If
PDF.js cannot run at all, the page falls back to a panel offering to open the
PDF in the device's own reader — the report is always reachable.

**PDF.js is the one third-party dependency in this repo**, committed under
`js/vendor/` because there is no package manager here. It is roughly 1.8 MB on
disk but about 510 KB over the wire once GitHub Pages gzips it, and it is
loaded **only** on the report page and **only** on devices that need it.
Desktop visitors never download it. See `js/vendor/README.md` for the version
and how to update it.

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

**Survey buttons are automatic too.** If a report's PDF contains a URL with
"survey" in it (the Community Pulse link behind the button), the same Action
records it in `reports.json`, and that report's page shows a "Take the
survey" button in the toolbar and again below the document. A report without
one shows neither. Nothing to edit by hand.

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

Because the pages fetch `reports.json` with JavaScript, opening the HTML files
by double-clicking them (`file://...`) will NOT load the report list —
browsers block that for security. Run the included preview server from the
project folder instead:

```
python3 scripts/serve.py
```

then visit `http://localhost:8000` in your browser. Stop it with Ctrl+C.

**Use that script rather than plain `python3 -m http.server`.** The site's
links are extensionless (`/about`, not `/about.html`) because that is how
GitHub Pages serves them — but the plain Python server doesn't do that and
returns 404 for `/about`, which makes the site look broken locally when it is
fine live. `scripts/serve.py` is the same tiny server with that one behaviour
added.

Neither limitation applies once the site is live — only to local testing.

## Page URLs

Links across the site are written without the `.html` extension:

| Page            | URL                     |
| --------------- | ----------------------- |
| Home            | `/`                     |
| Market Reports  | `/market-reports`       |
| A single report | `/report?month=2026-08` |
| Community Pulse | `/community-pulse`      |
| About Us        | `/about`                |
| Contact Us      | `/contact`              |

GitHub Pages serves `about.html` at `/about` automatically — no redirect and
no folder restructuring, so the files stay exactly where they are. The old
`/about.html` URLs still work too, so any link already shared out stays valid.

Because these links start with `/`, the site has to be served from the root of
a domain. It is — `CNAME` points at `liveyarcobr.com`. If it were ever moved
to a project-page URL like `username.github.io/YARCOBR/`, those links would
need a prefix.

### The "page not found" page

`404.html` is shown automatically for any address that doesn't exist —
mistyped URLs, and old links to reports that have since been removed. It
offers the main sections plus a direct link to the current market report,
which it reads from `reports.json` at runtime.

Every path inside `404.html` starts with `/` on purpose: GitHub Pages serves
that file at whatever wrong address the visitor typed, so a relative path
would resolve against the broken URL and fail too. Keep that in mind if you
edit it.

## Compressing PDFs

GitHub warns above 50MB and hard-blocks above 100MB. A 5–7 page report should
realistically be 1–5MB. If yours is much larger, the images inside it are
probably too high-resolution — compress with:

- [Smallpdf](https://smallpdf.com/compress-pdf) or [iLovePDF](https://www.ilovepdf.com/compress_pdf)
- Mac Preview: File → Export → Quartz Filter → Reduce File Size
- Adobe Acrobat: File → Save As Other → Reduced Size PDF

## Making links in a PDF clickable

Illustrator can't add hyperlinks, so a URL in a report (like the survey link
behind the "Take our survey" button) is just text. Desktop Chrome guesses a
link from that text, so it looks fine on a laptop, but phones, Safari, and
the report page's phone viewer don't make it tappable.

After compressing, run this on the final PDF to add a real link over every
URL in its text:

```
npm install                                     # once
node scripts/add-pdf-links.mjs reports/2026-10.pdf --dry-run   # see what it finds
node scripts/add-pdf-links.mjs reports/2026-10.pdf             # edit the file in place
```

It is safe to run twice, and it doesn't change how the pages look. Run it
**after** compressing: some compressors remove links.

## Colors, fonts & motion

All brand values live at the top of `styles.css` as CSS variables. Change a
value there and every page updates. The palette is sampled from the
community's own aerial photograph rather than picked off a real-estate
template:

| Variable   | What it is                                                                             |
| ---------- | -------------------------------------------------------------------------------------- |
| `--deep`   | The Atlantic at the horizon. Every dark band.                                          |
| `--harbor` | Primary action colour — buttons, links, chart slice A.                                 |
| `--shoal`  | The turquoise shallows. Accents on dark only; too light for text on white.             |
| `--clay`   | Barrel-tile terracotta. Deliberately rare — the active nav marker, one CTA per screen. |
| `--paper`  | Sun-bleached stucco. The page background.                                              |

Type is **Fraunces** for display, **Archivo** for body and UI, and **IBM Plex
Mono** for the small uppercase data labels. They load with `<link>` tags in
each page's `<head>` rather than an `@import` in the stylesheet, so they
download in parallel with the CSS instead of queueing behind it. Adding a page
means copying those three `<link>` tags across.

### The waterline

The recurring device is `.rule` — a labelled hairline with soundings ticked
along it, opening each major section:

```html
<div class="rule">
  <span class="rule-label">Archive</span>
  <span class="rule-line" aria-hidden="true"></span>
  <span class="rule-value">3 reports</span>
</div>
```

Give it something true to say. It carries the current report's month, the
number of reports in the archive, the survey period — not a slogan. Over a
photograph it reorders itself so both pieces of text stay in the darkened left
column; see the comment beside `.hero .rule-value` in the stylesheet.

### Motion

`js/motion.js` is loaded from `<head>` **without `defer`** on purpose, and the
comment at the top of that file explains why — deferring it makes every
section flash into view and then hide itself.

Anything with `class="reveal"` fades up when it scrolls into view. A container
with `data-stagger` gets that class applied to each of its children
automatically, numbered so they arrive one after another.

Two things must stay true:

- **The `.reveal` styles only apply inside `.js-motion`**, a class that
  `motion.js` adds to `<html>` only when JavaScript is running _and_ the reader
  has not asked for reduced motion. With either of those false, every element
  is simply visible. Content must never be able to strand itself at opacity 0.
- **Content injected after page load has to be re-scanned** — call
  `window.Motion.scan(container)` after rendering, as `market-reports.html`
  does. Cards built from `reports.json` did not exist when the observer was
  set up.

### One trap worth knowing

The `hidden` attribute is only `display: none` in the _browser's_ default
stylesheet, and any author rule beats that no matter how specific. Several
elements toggle with `.hidden = true/false` while also being `.btn` or
`.cta-bar`, which set `display` — so `styles.css` carries an explicit
`[hidden] { display: none !important }`. Do not remove it.
