/**
 * Scans /survey for files named YYYY-MM.pdf and writes survey.json at the
 * repo root, same pattern as generate-reports-json.js. This keeps the
 * "Community Pulse" title/period shown on the home page and community-pulse
 * page in sync with whatever survey PDF was most recently uploaded.
 *
 * NOTE: this only automates the *title/period label* — it does NOT
 * automate the actual survey numbers, charts, or key takeaways on
 * community-pulse.html. Those still need to be updated by hand each time
 * (see the comment at the top of community-pulse.html).
 */
const fs = require("fs");
const path = require("path");

const SURVEY_DIR = path.join(__dirname, "..", "survey");
const OUTPUT_FILE = path.join(__dirname, "..", "survey.json");

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

const FILENAME_PATTERN = /^(\d{4})-(\d{2})\.pdf$/;

function main() {
  const allFiles = fs.readdirSync(SURVEY_DIR);
  const surveys = [];
  const skipped = [];

  allFiles.forEach(function (filename) {
    if (filename === "README.md") return;
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

    surveys.push({
      slug: year + "-" + match[2],
      title: MONTH_NAMES[monthNum - 1] + " " + year,
      pdf: "survey/" + filename,
    });
  });

  surveys.sort(function (a, b) {
    return b.slug.localeCompare(a.slug);
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(surveys, null, 2) + "\n");

  console.log("Wrote " + surveys.length + " survey(s) to survey.json");
  if (skipped.length) {
    console.warn(
      "Skipped " +
        skipped.length +
        ' file(s) that do not match "YYYY-MM.pdf": ' +
        skipped.join(", "),
    );
  }
}

main();
