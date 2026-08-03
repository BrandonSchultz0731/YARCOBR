/* ==========================================================================
   MONTHLY WORKFLOW — this is the only file you need to edit each month.

   1. Compress your PDF (aim under ~5MB) and upload it to the /reports folder,
      named like "2026-08.pdf" (YYYY-MM.pdf).
   2. Add one new object to the top of the REPORTS array below.
   3. Commit + push. The home page, archive page, and individual report page
      all update automatically — nothing else to touch.

   Fields:
     slug    - used in the URL, e.g. report.html?month=2026-08
     title   - display title, e.g. "August 2026"
     date    - same as title, used for sorting text (keep format consistent)
     pdf     - path to the PDF file in /reports
     excerpt - one sentence shown on cards
   ========================================================================== */

const REPORTS = [
  {
    slug: "2026-08",
    title: "August 2026",
    pdf: "reports/2026-08.pdf",
    excerpt:
      "Comprehensive analysis of YARCOBR real estate activity, trends, and community insights.",
  },
];

// Helper: find a report by its slug
function getReportBySlug(slug) {
  return REPORTS.find(function (r) {
    return r.slug === slug;
  });
}

// Helper: find the previous/next report relative to a given index (chronological order in this array = newest first)
function getAdjacentReports(slug) {
  const index = REPORTS.findIndex(function (r) {
    return r.slug === slug;
  });
  return {
    newer: index > 0 ? REPORTS[index - 1] : null,
    older: index >= 0 && index < REPORTS.length - 1 ? REPORTS[index + 1] : null,
  };
}
