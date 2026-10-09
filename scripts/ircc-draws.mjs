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
 * Largest gap allowed between consecutive published draw numbers. IRCC
 * numbers rounds sequentially and the feed lists them all, so a bigger gap
 * means a garbled number (e.g. "4470" for 447) — which would otherwise be
 * published as the newest draw and, as the monitor's high-water mark, hide
 * every real draw from the report for good. Checked within the feed, so it
 * doesn't depend on how long the daily job was down.
 */
export const MAX_DRAW_GAP = 5;

/** Express Entry's first round was in January 2015. */
const FIRST_DRAW_DATE = "2015-01-01";

/**
 * Stream names as IRCC writes them ("Trades Occupations, 2026-Version 3"):
 * letters, digits and plain punctuation. They're published on the site and
 * in the review issue without human review, so anything else — markup, @, |,
 * a URL, a paragraph of text — is refused rather than shown.
 */
export const STREAM_RE = /^[\p{L}\p{N} .,'’&()/:+–—-]{1,120}$/u;

/** Things that look like a link — never part of a real stream name. */
const LINK_LIKE = /https?:|www\.|\.[a-z]{2,}\//i;

const DATA_NOTE =
  "Written by scripts/policy-monitor.mjs --update from IRCC's official rounds feed " +
  "(daily GitHub Action). Do not edit by hand.";

/**
 * A whole number such as "5,000", "5 000" or "418" up to `max`; NaN for
 * anything else. Thousands may be grouped with a comma or any of the spaces
 * used for that (regular, no-break, narrow no-break, thin).
 */
export function parseCount(value, max) {
  const s = String(value ?? "").trim();
  if (!/^\d{1,3}([, \u00A0\u202F\u2009]\d{3})*$|^\d+$/.test(s)) return NaN;
  const n = Number(s.replace(/\D/g, ""));
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
  if (!STREAM_RE.test(s) || LINK_LIKE.test(s)) {
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
  const kept = rounds.slice(0, limit);
  // Only the published rounds are checked, so an odd value in a years-old
  // round can't block today's refresh.
  for (let i = 0; i + 1 < kept.length; i++) {
    const [newer, older] = [kept[i], kept[i + 1]];
    if (newer.drawNumber - older.drawNumber > MAX_DRAW_GAP || newer.date < older.date) {
      throw new Error(
        `draw ${newer.drawNumber} (${newer.date}) doesn't follow draw ${older.drawNumber} ` +
          `(${older.date}) — refusing to overwrite draw data`,
      );
    }
  }
  return kept.map((r) => ({ ...r, stream: cleanStream(r.stream) }));
}

/**
 * How many rows look newer than `newest` but were skipped as invalid — a
 * sign IRCC changed the feed's format, which would otherwise mean new draws
 * silently stop appearing.
 */
export function countSkippedNewer(raw, newest) {
  const rows = Array.isArray(raw?.rounds) ? raw.rounds : [];
  return rows.filter((row) => {
    const digits = String(row?.drawNumber ?? "").replace(/\D/g, "");
    const n = digits.length <= 4 ? Number(digits) : 0;
    return n > newest;
  }).length;
}

/**
 * Throws if published draws within the refreshed range are missing from the
 * new data — IRCC doesn't delete rounds, so this means rows that no longer
 * parse, and publishing would silently drop them.
 */
export function assertNoneMissing(publishedRounds, rounds) {
  const oldest = rounds[rounds.length - 1].drawNumber;
  const kept = new Set(rounds.map((r) => r.drawNumber));
  const missing = publishedRounds.filter((r) => r.drawNumber >= oldest && !kept.has(r.drawNumber));
  if (missing.length > 0) {
    throw new Error(
      `${missing.length} published draw(s) missing from the IRCC feed — refusing to overwrite draw data`,
    );
  }
}

/**
 * Throws if the feed's newest draw is older than the published one — a
 * stale or truncated copy of the feed (e.g. from a CDN edge) must not roll
 * the site's draw data back. Corrections to existing draws are fine.
 */
export function assertNotOlder(publishedRounds, rounds) {
  const published = publishedRounds[0]?.drawNumber ?? 0;
  if (rounds[0].drawNumber < published) {
    throw new Error(
      `feed's newest draw ${rounds[0].drawNumber} is older than the published ${published} — ` +
        "refusing to overwrite draw data",
    );
  }
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
