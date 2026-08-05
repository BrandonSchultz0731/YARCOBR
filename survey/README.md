# Adding a new survey results PDF

1. Click **Add file → Upload files** in this folder on GitHub.
2. Drag in the PDF.
3. **Rename it before uploading (or right after) to exactly: `YYYY-MM.pdf`**
   Example: July 2026 → `2026-07.pdf`
4. Click **Commit changes**.

This is the same naming rule as the `/reports` folder. Within about a minute
the "View Full Survey Results" and "Download Survey Report" buttons on
`community-pulse.html` will automatically point at the new file, and the
Community Pulse panel on the home page will pick up the new month.

**Important:** the filename must be exactly 4 digits, a dash, 2 digits, then
`.pdf` (e.g. `2026-07.pdf`). Files that don't match this pattern are ignored
(they simply won't show up — nothing will break). If no matching PDF exists
at all, the download buttons hide themselves rather than linking to a file
that isn't there.

## What this does NOT do

Uploading a PDF here does **not** update the statistics, donut charts, key
takeaways, or community summary shown on `community-pulse.html`. Those numbers are
specific to each survey and can't be derived from a filename — whoever
compiles the results still needs to edit them by hand in that file each
cycle. See the comment at the top of `community-pulse.html`.
