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

/** Highest possible CRS score; anything above it is a parsing error. */
const MAX_CRS = 1200;

const DATA_NOTE =
  "Written by scripts/policy-monitor.mjs --update from IRCC's official rounds feed " +
  "(daily GitHub Action). Do not edit by hand.";

const toInt = (value) => parseInt(String(value ?? "").replace(/\D/g, ""), 10);

/**
 * Converts the raw feed into DrawRound objects (see lib/types.ts), newest
 * first, keeping at most `limit`. Throws instead of returning partial data.
 */
export function normalizeRounds(raw, limit = ROUNDS_TO_KEEP) {
  const rows = raw?.rounds;
  if (!Array.isArray(rows)) {
    throw new Error("unexpected IRCC rounds format: missing `rounds` array");
  }

  const seen = new Set();
  const rounds = [];
  for (const row of rows) {
    const round = {
      drawNumber: toInt(row?.drawNumber),
      date: String(row?.drawDate ?? "").trim(),
      stream: String(row?.drawName ?? "").trim() || "Unknown",
      invitations: toInt(row?.drawSize) || 0,
      cutoff: toInt(row?.drawCRS),
    };
    const valid =
      round.drawNumber > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(round.date) &&
      round.cutoff > 0 &&
      round.cutoff <= MAX_CRS;
    if (!valid || seen.has(round.drawNumber)) continue;
    seen.add(round.drawNumber);
    rounds.push(round);
  }

  if (rounds.length < MIN_VALID_ROUNDS) {
    throw new Error(
      `only ${rounds.length} valid rounds in IRCC feed — refusing to overwrite draw data`,
    );
  }
  rounds.sort((a, b) => b.drawNumber - a.drawNumber);
  return rounds.slice(0, limit);
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
