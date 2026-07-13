#!/usr/bin/env node

/**
 * scripts/version.js
 *
 * Generates a VERSION_HISTORY.md section by reading the latest git tags.
 * Run as part of the docs build: `node scripts/version.js`
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function getVersionHistory() {
  try {
    // Get all tags sorted by creation date (newest first), limit to 10
    const tags = execSync("git tag --sort=-creatordate", { encoding: "utf-8" })
      .trim()
      .split("\n")
      .filter(Boolean)
      .slice(0, 10);

    if (tags.length === 0) {
      return "No version tags found yet. Use `git tag v1.0.0` to create one.";
    }

    const rows = tags.map((tag) => {
      let date;
      try {
        date = execSync(`git log -1 --format=%ci ${tag}`, { encoding: "utf-8" }).trim().split(" ")[0];
      } catch {
        date = "unknown";
      }

      let message;
      try {
        message = execSync(`git tag -l --format='%(contents:subject)' ${tag}`, { encoding: "utf-8" }).trim();
        if (!message) {
          message = execSync(`git log -1 --format=%s ${tag}`, { encoding: "utf-8" }).trim();
        }
      } catch {
        message = "";
      }

      return `| ${tag} | ${date} | ${message} |`;
    });

    return [
      "| Version | Date | Description |",
      "|---------|------|-------------|",
      ...rows
    ].join("\n");
  } catch {
    return "Unable to read git history.";
  }
}

// Generate the markdown
const history = getVersionHistory();
const output = `## Version History\n\n${history}\n`;

// Write to docs/VERSION_HISTORY.md
const outPath = path.join(__dirname, "..", "docs", "VERSION_HISTORY.md");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, output, "utf-8");

console.log(`Version history written to ${outPath}`);
console.log(output);
