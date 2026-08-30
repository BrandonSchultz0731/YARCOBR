# Vendored third-party code

## PDF.js — 6.3.289 (legacy build), Apache-2.0

`pdf.min.mjs` and `pdf.worker.min.mjs` are Mozilla's PDF.js, copied verbatim
from the `pdfjs-dist` package. Nothing here is modified, and nothing in the
site build touches these files — they are committed so the site keeps working
with no package manager and no build step, exactly like the rest of the repo.

**Why it exists.** Phones and tablets cannot display a PDF inline. iOS Safari
renders an embedded PDF as a single frozen first page, and most Android
browsers refuse to render one at all, so a resident on a phone could not read
the monthly report on the page. PDF.js draws the pages to a `<canvas>`, which
needs no native PDF support.

**Where it loads.** Only on `/report`, and only on devices that cannot display
a PDF natively — see `js/pdf-inline.js`. Desktop browsers keep the built-in
viewer, which is faster and better, and never download these files.

**The `legacy` build on purpose.** It targets older browsers. A meaningful
share of this community's readers are over 80 and on older iPads, which is
exactly the audience the modern build would drop.

### Updating

Download a newer `pdfjs-dist`, copy `legacy/build/pdf.min.mjs` and
`legacy/build/pdf.worker.min.mjs` over these two, and update the version
above. The two files must always come from the same release — a worker that
does not match its library fails at runtime.
