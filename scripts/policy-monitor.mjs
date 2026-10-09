#!/usr/bin/env node
/**
 * IRCC policy monitor — the automated half of the hybrid update model.
 *
 * Watches two official feeds:
 *   1. Express Entry rounds JSON (new draws / cutoff changes)
 *   2. IRCC news releases (Atom feed on canada.ca)
 *
 * Compares against data/monitor-state.json and prints a markdown report of
 * anything new. Draw data is the one thing it updates directly: with
 * --update it rewrites data/ee-draws.json, which by design needs no human
 * review (it mirrors IRCC's published rounds). It NEVER edits the planner's
 * rules — a human verifies each policy change against the official source
 * first (see lib/rules/parameters.ts).
 *
 * Usage:
 *   node scripts/policy-monitor.mjs            # report to stdout
 *   node scripts/policy-monitor.mjs --update   # also write draw data + state
 *
 * The daily GitHub Action (.github/workflows/site.yml) runs it with --update,
 * commits the changed data files, redeploys the site when draws changed, and
 * posts the report to the policy-monitor review issue.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  IRCC_ROUNDS_URL,
  assertNoneMissing,
  assertNotOlder,
  countSkippedNewer,
  normalizeRounds,
  serializeDrawsFile,
} from "./ircc-draws.mjs";
import {
  assertFeedUrl,
  isCurrentDate,
  mdLink,
  mdText,
  nextNewsHighWater,
  parseAtomEntries,
  readCapped,
} from "./feed-safety.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE_PATH = join(ROOT, "data", "monitor-state.json");
const DRAWS_PATH = join(ROOT, "data", "ee-draws.json");

// canada.ca news Atom feed filtered to IRCC.
const NEWS_URL =
  "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofcitizenshipandimmigration&sort=publishedDate&orderBy=desc&pick=20&format=atom&atomtitle=IRCC";

const UPDATE = process.argv.includes("--update");

// Feed responses are untrusted input (see scripts/feed-safety.mjs): they must
// come over https from these hosts, after any redirects, and stay small.
const FEED_HOSTS = ["www.canada.ca", "api.io.canada.ca"];
const MAX_ROUNDS_BYTES = 10_000_000; // the full rounds history; well under 1 MB in 2026
const MAX_NEWS_BYTES = 2_000_000; // 20 entries

// canada.ca is intermittently slow from CI runners (several June 2026 runs
// timed out), so every fetch is bounded and retried with backoff.
const FETCH_TIMEOUT_MS = 30000;
const RETRY_DELAYS_MS = [5000, 20000];

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function fetchTextWithRetry(url, accept, maxBytes) {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
    }
    try {
      // The timeout covers the body too, so a stalled download is retried.
      const res = await fetch(url, {
        headers: { accept },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      assertFeedUrl(res.url, FEED_HOSTS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await readCapped(res, maxBytes);
      // Diagnostics for the run log (stderr, not the report).
      console.error(`Fetched ${text.length} chars from ${res.url}`);
      return text;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`${url} → ${lastError.message} (${RETRY_DELAYS_MS.length + 1} attempts)`);
}

async function checkDraws(state, report, errors) {
  const raw = JSON.parse(
    await fetchTextWithRetry(IRCC_ROUNDS_URL, "application/json", MAX_ROUNDS_BYTES),
  );
  const rounds = normalizeRounds(raw);
  const current = readJson(DRAWS_PATH, { rounds: [] });
  // Checked before anything is written, so a stale or partly unreadable feed
  // changes nothing.
  assertNotOlder(current.rounds, rounds);
  assertNoneMissing(current.rounds, rounds);
  const skipped = countSkippedNewer(raw, rounds[0].drawNumber);
  if (skipped > 0) {
    errors.push(
      `${skipped} newer draw row(s) in the IRCC feed couldn't be read and were skipped — ` +
        "check whether the feed's format changed",
    );
  }
  const lastDrawNumber = Math.max(state.lastDrawNumber, rounds[0].drawNumber);

  const fresh = rounds.filter((r) => r.drawNumber > state.lastDrawNumber);
  if (fresh.length > 0) {
    report.push(`## 🔢 ${fresh.length} new Express Entry draw(s)`);
    report.push("| # | Date | Stream | Invitations | CRS cutoff |");
    report.push("|---|------|--------|-------------|------------|");
    for (const r of fresh.slice(0, 15)) {
      report.push(
        `| ${r.drawNumber} | ${r.date} | ${mdText(r.stream)} | ${r.invitations.toLocaleString("en-CA")} | **${r.cutoff}** |`,
      );
    }
    if (fresh.length > 15) report.push(`\n_…and ${fresh.length - 15} older draw(s) not shown._`);
    report.push("");
    report.push("→ Published to the site automatically via `data/ee-draws.json`.");

    // A stream name the site has never seen may be a new draw category that
    // lib/draws.ts streamKey() should map to a planner category.
    const known = new Set(current.rounds.map((r) => r.stream));
    const unseen = [...new Set(fresh.map((r) => r.stream))].filter((s) => !known.has(s));
    if (unseen.length > 0) {
      report.push(
        `→ New stream name(s): ${unseen.map((s) => `"${mdText(s)}"`).join(", ")} — ` +
          "check whether `streamKey()` in `lib/draws.ts` should map them to a category.",
      );
    }
    report.push("");
  }

  const dataChanged = JSON.stringify(current.rounds) !== JSON.stringify(rounds);
  if (UPDATE && dataChanged) {
    const asOf = new Date().toISOString().slice(0, 10);
    writeFileSync(DRAWS_PATH, serializeDrawsFile({ asOf, rounds }));
    console.error(`Draw data updated: ${DRAWS_PATH}`);
  }

  return { lastDrawNumber, dataChanged: UPDATE && dataChanged };
}

async function checkNews(state, report, errors) {
  const xml = await fetchTextWithRetry(NEWS_URL, "application/atom+xml", MAX_NEWS_BYTES);
  const entries = parseAtomEntries(xml);
  // An error page or empty body must not look like "no news".
  if (!xml.includes("<feed") || entries.length === 0) {
    throw new Error("news feed returned no entries");
  }

  const since = Date.parse(state.lastNewsDate) || 0;
  const future = entries.filter((e) => e.updated && !isCurrentDate(e.updated));
  if (future.length > 0) {
    errors.push(`${future.length} announcement(s) dated in the future were ignored`);
  }
  const seenTitles = new Set();
  const fresh = entries.filter((e) => {
    // canada.ca sometimes lists the same release twice under different URLs.
    if (!isCurrentDate(e.updated) || seenTitles.has(e.title)) return false;
    seenTitles.add(e.title);
    return new Date(e.updated).getTime() > since;
  });

  if (fresh.length > 0) {
    report.push(`## 📰 ${fresh.length} new IRCC announcement(s)`);
    for (const e of fresh.slice(0, 15)) {
      report.push(`- **${mdText(e.updated.slice(0, 10))}** — ${mdLink(e.title, e.url)}`);
    }
    if (fresh.length > 15) report.push(`- _…and ${fresh.length - 15} more not shown._`);
    report.push("");
    report.push(
      "→ For each announcement: does it change eligibility rules, fees, " +
        "funds thresholds or categories? If yes, update `lib/rules/parameters.ts` " +
        "(bump `lastVerified` + `RULES_VERSION`) and add an entry to " +
        "`data/policy-updates.json`. Only links to canada.ca / gc.ca are kept.",
    );
    report.push("");
  }

  return nextNewsHighWater(
    state.lastNewsDate,
    entries.map((e) => e.updated),
  );
}

const state = readJson(STATE_PATH, {
  lastDrawNumber: 0,
  lastNewsDate: "1970-01-01T00:00:00Z",
});
const report = [];
const errors = [];
const nextState = { ...state };
let dataChanged = false;

try {
  const draws = await checkDraws(state, report, errors);
  nextState.lastDrawNumber = draws.lastDrawNumber;
  dataChanged = draws.dataChanged;
} catch (err) {
  errors.push(`Draws feed check failed: ${err.message}`);
}
try {
  nextState.lastNewsDate = await checkNews(state, report, errors);
} catch (err) {
  errors.push(`News feed check failed: ${err.message}`);
}

const changed = report.length > 0;

if (changed) {
  console.log("# IRCC policy monitor report\n");
  // GitHub rejects issue comments over 65,536 characters.
  const body = report.join("\n");
  console.log(body.length > 60000 ? `${body.slice(0, 60000)}\n\n_…report truncated._` : body);
} else {
  console.log("No new IRCC draws or announcements since last check.");
}
if (errors.length > 0) {
  console.log("\n## ⚠️ Monitor errors (feed unreachable or format changed)\n");
  // Error text can quote feed content, so it's escaped like everything else.
  for (const e of errors) console.log(`- ${mdText(e, 500)}`);
}

const stateChanged =
  nextState.lastDrawNumber !== state.lastDrawNumber ||
  nextState.lastNewsDate !== state.lastNewsDate;
if (UPDATE && stateChanged) {
  nextState.lastChecked = new Date().toISOString();
  writeFileSync(STATE_PATH, JSON.stringify(nextState, null, 2) + "\n");
  console.error(`State updated: ${STATE_PATH}`);
}

// Machine-readable flags for the CI workflow.
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(
    process.env.GITHUB_OUTPUT,
    `changes=${changed}\nerrors=${errors.length > 0}\ndata_changed=${dataChanged}\n`,
    { flag: "a" },
  );
}
