/**
 * Parsing for IRCC's published Express Entry rounds feed
 * (ee_rounds_123_en.json). Used by scripts/policy-monitor.mjs to refresh
 * data/ee-draws.json, and unit-tested in scripts/__tests__/.
 *
 * The feed is not a documented API and its values are strings ("5,000",
 * "470"), so parsing is defensive and refuses to produce a data file from a
 * feed it doesn't recognize — stale draw data beats wrong draw data.
 */

export const IRCC_ROUNDS_URL =
  "https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json";

/** Recent rounds kept on the site — enough to cover rarely drawn categories. */
export const ROUNDS_TO_KEEP = 40;

/** A parse yielding fewer valid rounds than this is treated as a broken feed. */
export const MIN_VALID_ROUNDS = 10;

/** Bounds on IRCC's numbers; anything outside them is a parsing error. */
export const LIMITS = {
  drawNumber: 9999,
  invitations: 50000, // the largest round ever was 27,332 (Feb 2021)
  cutoff: 1200, // the highest possible CRS score
};

/**
 * Most draws the high-water mark may advance in one refresh — far more than
 * IRCC holds in the months the daily job could plausibly be down. A bigger
 * jump means a garbled draw number, which would otherwise hide every real
 * draw from the report for good.
 */
export const MAX_DRAW_JUMP = 100;

/** Express Entry's first round was in January 2015. */
const FIRST_DRAW_DATE = "2015-01-01";

/**
 * Stream names as IRCC writes them ("Trades Occupations, 2026-Version 3"):
 * letters, digits and plain punctuation. They're published on the site and
 * in the review issue without human review, so anything else — markup, @, |,
 * a URL, a paragraph of text — is refused rather than shown.
 */
export const STREAM_RE = /^[\p{L}\p{N} .,'’&()/:+–—-]{1,120}$/u;

const DATA_NOTE =
  "Written by scripts/policy-monitor.mjs --update from IRCC's official rounds feed " +
  "(daily GitHub Action). Do not edit by hand.";

/** A whole number such as "5,000" or "418" up to `max`; NaN for anything else. */
export function parseCount(value, max) {
  const s = String(value ?? "").trim();
  if (!/^\d{1,3}(,\d{3})*$|^\d+$/.test(s)) return NaN;
  const n = Number(s.replace(/,/g, ""));
  return Number.isSafeInteger(n) && n <= max ? n : NaN;
}

/** A real calendar date (YYYY-MM-DD) from the Express Entry era, not in the future. */
export function isPlausibleDrawDate(value, now = Date.now()) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const t = Date.parse(`${value}T00:00:00Z`);
  return (
    Number.isFinite(t) &&
    new Date(t).toISOString().slice(0, 10) === value && // rejects 2026-02-30
    value >= FIRST_DRAW_DATE &&
    t <= now + 2 * 86400_000 // time-zone slack
  );
}

/** The stream name, whitespace-normalized; throws if it isn't plain text. */
export function cleanStream(value) {
  const s = typeof value === "string" ? value.normalize("NFKC").replace(/\s+/g, " ").trim() : "";
  if (s === "") return "Unknown";
  if (!STREAM_RE.test(s) || /:\/\/|www\./i.test(s)) {
    // The raw value isn't echoed: this message ends up in the review issue.
    throw new Error("unexpected stream name in IRCC feed — refusing to overwrite draw data");
  }
  return s;
}

/**
 * Converts the raw feed into DrawRound objects (see lib/types.ts), newest
 * first, keeping at most `limit`. Rows with missing or out-of-range values
 * are skipped; a feed that doesn't look right as a whole throws instead of
 * returning partial data.
 */
export function normalizeRounds(raw, limit = ROUNDS_TO_KEEP, now = Date.now()) {
  const rows = raw?.rounds;
  if (!Array.isArray(rows)) {
    throw new Error("unexpected IRCC rounds format: missing `rounds` array");
  }

  const seen = new Set();
  const rounds = [];
  for (const row of rows) {
    const drawNumber = parseCount(row?.drawNumber, LIMITS.drawNumber);
    const date = String(row?.drawDate ?? "").trim();
    const size = String(row?.drawSize ?? "").trim();
    const invitations = size === "" ? 0 : parseCount(size, LIMITS.invitations);
    const cutoff = parseCount(row?.drawCRS, LIMITS.cutoff);
    const valid =
      drawNumber > 0 && isPlausibleDrawDate(date, now) && invitations >= 0 && cutoff > 0;
    if (!valid || seen.has(drawNumber)) continue;
    seen.add(drawNumber);
    rounds.push({ drawNumber, date, stream: row?.drawName, invitations, cutoff });
  }

  if (rounds.length < MIN_VALID_ROUNDS) {
    throw new Error(
      `only ${rounds.length} valid rounds in IRCC feed — refusing to overwrite draw data`,
    );
  }
  rounds.sort((a, b) => b.drawNumber - a.drawNumber);
  // Only the names that get published are checked, so an odd name in a
  // years-old round can't block today's refresh.
  return rounds.slice(0, limit).map((r) => ({ ...r, stream: cleanStream(r.stream) }));
}

/** The next draw high-water mark; throws on an implausible jump. */
export function nextDrawHighWater(previous, rounds) {
  const newest = rounds[0].drawNumber;
  if (previous > 0 && newest > previous + MAX_DRAW_JUMP) {
    throw new Error(
      `draw number jumped from ${previous} to ${newest} — refusing to update; ` +
        "if this is real, set lastDrawNumber in data/monitor-state.json by hand",
    );
  }
  return Math.max(previous, newest);
}

/**
 * Serializes data/ee-draws.json with one round per line, so each automated
 * commit's diff shows exactly which draws were added.
 */
export function serializeDrawsFile({ asOf, rounds }) {
  return [
    "{",
    `  "asOf": ${JSON.stringify(asOf)},`,
    `  "officialSource": ${JSON.stringify(IRCC_ROUNDS_URL)},`,
    `  "note": ${JSON.stringify(DATA_NOTE)},`,
    '  "rounds": [',
    rounds.map((round) => `    ${JSON.stringify(round)}`).join(",\n"),
    "  ]",
    "}",
    "",
  ].join("\n");
}
