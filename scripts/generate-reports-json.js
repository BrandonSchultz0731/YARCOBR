/**
 * Scans /reports for files named YYYY-MM.pdf and writes reports.json
 * at the repo root. Run automatically by .github/workflows/update-report-index.yml
 * whenever anything in /reports changes. Not meant to be run by hand,
 * but you can (`node scripts/generate-reports-json.js`) to test locally.
 */
const fs = require("fs");
const path = require("path");

const REPORTS_DIR = path.join(__dirname, "..", "reports");
const OUTPUT_FILE = path.join(__dirname, "..", "reports.json");

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Strict filename rule: exactly YYYY-MM.pdf
const FILENAME_PATTERN = /^(\d{4})-(\d{2})\.pdf$/;

function main() {
  const allFiles = fs.readdirSync(REPORTS_DIR);
  const reports = [];
  const skipped = [];

  allFiles.forEach(function (filename) {
    if (filename === "README.md") return; // expected, not an error
    const match = filename.match(FILENAME_PATTERN);

    if (!match) {
      skipped.push(filename);
      return;
    }

    const year = match[1];
    const monthNum = parseInt(match[2], 10);

    if (monthNum < 1 || monthNum > 12) {
      skipped.push(filename);
      return;
    }

    reports.push({
      slug: year + "-" + match[2],
      title: MONTH_NAMES[monthNum - 1] + " " + year,
      pdf: "reports/" + filename,
      excerpt:
        "Comprehensive analysis of YARCOBR real estate activity, trends, and community insights.",
    });
  });

  // Newest first
  reports.sort(function (a, b) {
    return b.slug.localeCompare(a.slug);
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(reports, null, 2) + "\n");

  console.log("Wrote " + reports.length + " report(s) to reports.json");
  if (skipped.length) {
    console.warn(
      "Skipped " +
        skipped.length +
        ' file(s) that do not match the required "YYYY-MM.pdf" naming pattern: ' +
        skipped.join(", "),
    );
  }
}

main();
