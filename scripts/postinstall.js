#!/usr/bin/env node
/**
 * Ver MCP — install hook
 * - Never fails the install (npx must stay green)
 * - Best-effort native rebuild for better-sqlite3
 * - Prints a short quick-start banner
 */
"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function quietRebuildSqlite() {
  try {
    // If the binding already loads, skip rebuild.
    require("better-sqlite3");
    return;
  } catch {
    // fall through
  }
  try {
    const r = spawnSync(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["rebuild", "better-sqlite3"],
      {
        stdio: "ignore",
        cwd: path.resolve(__dirname, ".."),
        env: process.env,
        timeout: 120000,
      }
    );
    if (r.status === 0) return;
  } catch {
    // ignore — user can npm rebuild better-sqlite3 manually
  }
}

function banner() {
  // Skip noisy banner in CI / non-TTY / npm quiet installs
  if (process.env.CI || process.env.npm_config_loglevel === "silent") return;
  if (!process.stdout.isTTY) return;

  const RESET = "\x1b[0m";
  const BOLD = "\x1b[1m";
  const GREEN = "\x1b[32m";
  const CYAN = "\x1b[36m";
  const DIM = "\x1b[2m";

  console.log("");
  console.log(`${GREEN}${BOLD}  ⬡ Ver MCP ready${RESET}`);
  console.log(`  ${CYAN}npx -y aic-mcp${RESET}   ${DIM}stdio MCP server${RESET}`);
  console.log(
    `  ${DIM}Claude/Cursor:${RESET} command=npx  args=["-y","aic-mcp"]`
  );
  console.log(
    `  ${DIM}Docs:${RESET} https://xlayer-delta.vercel.app/docs.html`
  );
  console.log("");
}

try {
  quietRebuildSqlite();
  banner();
} catch {
  // never fail install
}
process.exit(0);
