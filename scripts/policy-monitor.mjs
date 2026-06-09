#!/usr/bin/env node
/**
 * IRCC policy monitor — the automated half of the hybrid update model.
 *
 * Watches two official feeds:
 *   1. Express Entry rounds JSON (new draws / cutoff changes)
 *   2. IRCC news releases (Atom feed on canada.ca)
 *
 * Compares against data/monitor-state.json and prints a markdown report of
 * anything new. It NEVER edits the planner's rules itself — a human verifies
 * each change against the official source first (see lib/rules/parameters.ts).
 *
 * Usage:
 *   node scripts/policy-monitor.mjs            # report to stdout
 *   node scripts/policy-monitor.mjs --update   # also persist new state
 *
 * In CI the workflow opens a review issue when this script reports changes.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE_PATH = join(ROOT, "data", "monitor-state.json");

const ROUNDS_URL =
  "https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json";
// canada.ca news Atom feed filtered to IRCC.
const NEWS_URL =
  "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofcitizenshipandimmigration&sort=publishedDate&orderBy=desc&pick=20&format=atom&atomtitle=IRCC";

const UPDATE = process.argv.includes("--update");

function loadState() {
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return { lastDrawNumber: 0, lastNewsDate: "1970-01-01T00:00:00Z" };
  }
}

// canada.ca's bot protection can hang connections from datacenter IPs —
// always bound feed fetches so CI jobs fail fast instead of stalling.
const FETCH_TIMEOUT_MS = 20000;

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

async function checkDraws(state, report) {
  const data = await fetchJson(ROUNDS_URL);
  const rounds = (data.rounds ?? [])
    .map((r) => ({
      number: parseInt(String(r.drawNumber ?? "0").replace(/\D/g, ""), 10),
      date: r.drawDate,
      name: r.drawName,
      size: r.drawSize,
      crs: r.drawCRS,
    }))
    .filter((r) => r.number > 0);

  const fresh = rounds.filter((r) => r.number > state.lastDrawNumber);
  if (fresh.length > 0) {
    report.push(`## 🔢 ${fresh.length} new Express Entry draw(s)`);
    report.push("| # | Date | Stream | Invitations | CRS cutoff |");
    report.push("|---|------|--------|-------------|------------|");
    for (const r of fresh.slice(0, 15)) {
      report.push(`| ${r.number} | ${r.date} | ${r.name} | ${r.size} | **${r.crs}** |`);
    }
    report.push("");
    report.push(
      "→ Review whether `data/ee-draws-snapshot.json` should be refreshed " +
        "(production reads the live feed; the snapshot is the offline fallback).",
    );
    report.push("");
  }
  return rounds.length > 0 ? Math.max(...rounds.map((r) => r.number)) : state.lastDrawNumber;
}

async function checkNews(state, report) {
  const res = await fetch(NEWS_URL, {
    headers: { accept: "application/atom+xml" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${NEWS_URL} → HTTP ${res.status}`);
  const xml = await res.text();

  // Minimal Atom parsing — defensive, dependency-free.
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => {
    const block = m[1];
    const pick = (tag) => {
      const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
    };
    const link = block.match(/<link[^>]*href="([^"]+)"/);
    return {
      title: pick("title"),
      updated: pick("updated") || pick("published"),
      url: link ? link[1] : "",
    };
  });

  const cutoff = new Date(state.lastNewsDate).getTime();
  const fresh = entries.filter((e) => e.updated && new Date(e.updated).getTime() > cutoff);

  if (fresh.length > 0) {
    report.push(`## 📰 ${fresh.length} new IRCC announcement(s)`);
    for (const e of fresh.slice(0, 15)) {
      report.push(`- **${e.updated.slice(0, 10)}** — [${e.title}](${e.url})`);
    }
    report.push("");
    report.push(
      "→ For each announcement: does it change eligibility rules, fees, " +
        "funds thresholds or categories? If yes, update `lib/rules/parameters.ts` " +
        "(bump `lastVerified` + `RULES_VERSION`) and add an entry to " +
        "`data/policy-updates.json`.",
    );
    report.push("");
  }

  const newest = entries
    .map((e) => e.updated)
    .filter(Boolean)
    .sort()
    .at(-1);
  return newest ?? state.lastNewsDate;
}

const state = loadState();
const report = [];
const errors = [];
let nextState = { ...state };

try {
  nextState.lastDrawNumber = await checkDraws(state, report);
} catch (err) {
  errors.push(`Draws feed check failed: ${err.message}`);
}
try {
  nextState.lastNewsDate = await checkNews(state, report);
} catch (err) {
  errors.push(`News feed check failed: ${err.message}`);
}

const changed = report.length > 0;

if (changed) {
  console.log("# IRCC policy monitor report\n");
  console.log(report.join("\n"));
} else {
  console.log("No new IRCC draws or announcements since last check.");
}
if (errors.length > 0) {
  console.log("\n## ⚠️ Monitor errors (feed unreachable or format changed)\n");
  for (const e of errors) console.log(`- ${e}`);
}

if (UPDATE && changed) {
  nextState.lastChecked = new Date().toISOString();
  writeFileSync(STATE_PATH, JSON.stringify(nextState, null, 2) + "\n");
  console.error(`\nState updated: ${STATE_PATH}`);
}

// Machine-readable flag for the CI workflow.
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(
    process.env.GITHUB_OUTPUT,
    `changes=${changed}\nerrors=${errors.length > 0}\n`,
    { flag: "a" },
  );
}
