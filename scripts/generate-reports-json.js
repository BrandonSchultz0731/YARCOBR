/**
 * Scans /reports for files named YYYY-MM.pdf and writes reports.json
 * at the repo root. Run automatically by .github/workflows/update-report-index.yml
 * whenever anything in /reports changes. Not meant to be run by hand,
 * but you can (`node scripts/generate-reports-json.js`) to test locally.
 *
 * If a report's text contains a survey URL (any link with "survey" in it,
 * like the Mailchimp Community Pulse link behind the button), it is listed
 * as `survey`, and the report page shows a survey button above and below the
 * document. Nothing to edit by hand: the URL comes from the PDF itself.
 */
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

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

const SURVEY_URL = /survey/i;

/**
 * The first survey URL in the PDF's text, or null. Never throws: a PDF that
 * cannot be read still gets listed, just without a survey button.
 */
async function findSurvey(file) {
  try {
    const { findUrls } = await import(
      pathToFileURL(path.join(__dirname, "lib", "pdf-urls.mjs")).href
    );
    const urls = await findUrls(new Uint8Array(fs.readFileSync(file)));
    const hit = urls.find(function (u) {
      return SURVEY_URL.test(u.url);
    });
    return hit ? hit.url : null;
  } catch (err) {
    console.warn("Could not read " + path.basename(file) + ": " + err.message);
    return null;
  }
}

async function main() {
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

  for (const report of reports) {
    const survey = await findSurvey(path.join(__dirname, "..", report.pdf));
    if (survey) report.survey = survey;
  }

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

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
