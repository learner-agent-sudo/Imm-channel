import { describe, expect, it } from "vitest";
import { MIN_VALID_ROUNDS, normalizeRounds, serializeDrawsFile } from "../ircc-draws.mjs";

/** A round in the shape of IRCC's ee_rounds_123_en.json: every value a string. */
function rawRound(n: number, overrides: Record<string, string> = {}) {
  return {
    drawNumber: String(n),
    drawNumberURL: `<a href='#'>${n}</a>`,
    drawDate: `2026-07-${String((n % 28) + 1).padStart(2, "0")}`,
    drawDateFull: "July 1, 2026",
    drawName: "Canadian Experience Class",
    drawSize: "3,000",
    drawCRS: "518",
    ...overrides,
  };
}

const feed = (rows: object[]) => ({ classes: "", rounds: rows });
const validRows = (count: number, start = 400) =>
  Array.from({ length: count }, (_, i) => rawRound(start + i));

describe("normalizeRounds", () => {
  it("parses IRCC's string fields, including thousands separators", () => {
    const [newest] = normalizeRounds(
      feed([...validRows(MIN_VALID_ROUNDS), rawRound(500, { drawSize: "5,000", drawCRS: "409" })]),
    );
    expect(newest).toEqual({
      drawNumber: 500,
      date: "2026-07-25",
      stream: "Canadian Experience Class",
      invitations: 5000,
      cutoff: 409,
    });
  });

  it("sorts newest first, skips invalid and duplicate rows, and caps the count", () => {
    const rows = [
      ...validRows(15),
      rawRound(450, { drawCRS: "" }), // no cutoff
      rawRound(451, { drawDate: "July 2, 2026" }), // not an ISO date
      rawRound(452, { drawCRS: "1500" }), // above the CRS maximum
      rawRound(405), // duplicate draw number
    ];
    const rounds = normalizeRounds(feed(rows), 12);
    expect(rounds).toHaveLength(12);
    expect(rounds[0].drawNumber).toBe(414);
    expect(rounds.map((r) => r.drawNumber)).toEqual(
      [...rounds.map((r) => r.drawNumber)].sort((a, b) => b - a),
    );
    expect(rounds.some((r) => r.drawNumber >= 450)).toBe(false);
  });

  it("refuses to produce data from a feed with too few valid rounds", () => {
    expect(() => normalizeRounds(feed(validRows(MIN_VALID_ROUNDS - 1)))).toThrow(/refusing/);
  });

  it("rejects a feed without a rounds array", () => {
    expect(() => normalizeRounds({ draws: [] })).toThrow(/rounds/);
    expect(() => normalizeRounds(null)).toThrow(/rounds/);
  });
});

describe("serializeDrawsFile", () => {
  it("writes valid JSON with one round per line", () => {
    const rounds = normalizeRounds(feed(validRows(MIN_VALID_ROUNDS)));
    const text = serializeDrawsFile({ asOf: "2026-10-06", rounds });
    const parsed = JSON.parse(text);
    expect(parsed.asOf).toBe("2026-10-06");
    expect(parsed.rounds).toEqual(rounds);
    expect(text.split("\n").filter((line) => line.includes('"drawNumber"'))).toHaveLength(
      rounds.length,
    );
  });
});
