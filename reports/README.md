# Adding a new market report

1. Click **Add file → Upload files** in this folder on GitHub.
2. Drag in the PDF.
3. **Rename it before uploading (or right after) to exactly: `YYYY-MM.pdf`**
   Example: August 2026 → `2026-08.pdf`
4. Click **Commit changes**.

That's it. Within about a minute, the new report will automatically appear on
the home page, the Market Reports archive, and get its own page — nothing
else to edit.

**Important:** the filename must be exactly 4 digits, a dash, 2 digits, then
`.pdf` (e.g. `2026-08.pdf`). Files that don't match this pattern are ignored
by the site (they simply won't show up — nothing will break).

To remove a report, delete its PDF from this folder and commit — it will
disappear from the site automatically too.

## Does the PDF have buttons or links? Make them clickable first

Illustrator can't add real hyperlinks, so a button in the PDF (a survey link,
"SUBMIT YOUR GUESS", etc.) only works if its URL is written as text behind it.
Desktop Chrome turns that text into a link on its own, so it will **look fine
on a computer but do nothing on a phone**.

Before uploading, run this once on the final PDF, from a copy of the repo on
your computer (after `npm install` the first time):

```
node scripts/add-pdf-links.mjs reports/2026-12.pdf
```

It finds every URL written in the PDF and adds a real, clickable link over it,
then prints what it linked. Run it after any compressing, since some
compressors drop links. Running it twice does no harm. To check without
changing the file, add `--dry-run`.

To test, open the report page on a phone (or narrow the browser window to
phone width) and tap each button.
