import { describe, expect, it } from "vitest";
import {
  MAX_DRAW_GAP,
  MIN_VALID_ROUNDS,
  assertNotOlder,
  cleanStream,
  isPlausibleDrawDate,
  normalizeRounds,
  parseCount,
  serializeDrawsFile,
} from "../ircc-draws.mjs";

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
      feed([...validRows(MIN_VALID_ROUNDS), rawRound(410, { drawSize: "5,000", drawCRS: "409" })]),
    );
    expect(newest).toEqual({
      drawNumber: 410,
      date: "2026-07-19",
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

  it("skips rows with garbled or out-of-range numbers instead of mangling them", () => {
    const rows = [
      ...validRows(MIN_VALID_ROUNDS),
      rawRound(460, { drawNumber: "418,419" }), // two numbers run together
      rawRound(461, { drawSize: "5,000,000,000" }), // impossible round size
      rawRound(462, { drawCRS: "4e2" }),
      rawRound(463, { drawDate: "2099-01-01" }), // in the future
      rawRound(464, { drawDate: "2026-02-30" }), // not a real date
    ];
    const numbers = normalizeRounds(feed(rows)).map((r) => r.drawNumber);
    expect(Math.max(...numbers)).toBe(400 + MIN_VALID_ROUNDS - 1);
  });

  it("refuses to publish a stream name that isn't plain text", () => {
    for (const drawName of [
      "Provincial Nominee Program | x |",
      "Pay the fee at https://evil.example",
      "Canadian Experience Class @octocat",
      "x".repeat(121),
    ]) {
      const rows = [...validRows(MIN_VALID_ROUNDS), rawRound(410, { drawName })];
      expect(() => normalizeRounds(feed(rows)), drawName).toThrow(/stream name/);
    }
  });

  it("refuses a garbled draw number that would become the newest draw", () => {
    const rows = [...validRows(MIN_VALID_ROUNDS), rawRound(4090)]; // "4090" for 409
    expect(() => normalizeRounds(feed(rows))).toThrow(/doesn't follow/);
    const ok = [...validRows(MIN_VALID_ROUNDS), rawRound(409 + MAX_DRAW_GAP)];
    expect(normalizeRounds(feed(ok))[0].drawNumber).toBe(409 + MAX_DRAW_GAP);
  });

  it("refuses draw numbers whose dates run backwards", () => {
    const rows = [...validRows(MIN_VALID_ROUNDS), rawRound(410, { drawDate: "2026-07-01" })];
    expect(() => normalizeRounds(feed(rows))).toThrow(/doesn't follow/);
  });

  it("only checks the names of rounds it keeps", () => {
    const rows = [rawRound(1, { drawName: "Old <odd> name" }), ...validRows(MIN_VALID_ROUNDS)];
    expect(() => normalizeRounds(feed(rows), MIN_VALID_ROUNDS)).not.toThrow();
  });
});

describe("parseCount", () => {
  it("accepts plain and comma-grouped whole numbers within the limit", () => {
    expect(parseCount("5,000", 50000)).toBe(5000);
    expect(parseCount(" 418 ", 9999)).toBe(418);
  });

  it("rejects everything else", () => {
    for (const bad of ["418,419", "1e9", "-7", "4.5", "", "N/A", "12,34", "9".repeat(400)]) {
      expect(parseCount(bad, 9999), bad).toBeNaN();
    }
  });
});

describe("isPlausibleDrawDate", () => {
  const now = Date.parse("2026-10-01T00:00:00Z");
  it("accepts real dates from the Express Entry era up to today", () => {
    expect(isPlausibleDrawDate("2026-09-30", now)).toBe(true);
    expect(isPlausibleDrawDate("2015-01-31", now)).toBe(true);
  });
  it("rejects impossible, pre-2015 and future dates", () => {
    for (const bad of ["9999-99-99", "2026-02-30", "2014-12-31", "2099-01-01", "July 2, 2026"]) {
      expect(isPlausibleDrawDate(bad, now), bad).toBe(false);
    }
  });
});

describe("cleanStream", () => {
  it("keeps IRCC's real names as they are", () => {
    for (const name of [
      "Canadian Experience Class",
      "French-Language proficiency 2026-Version 2",
      "Senior managers with Canadian Work Experience, 2026-Version 1",
      "Agriculture and agri-food occupations (Version 1)",
    ]) {
      expect(cleanStream(name)).toBe(name);
    }
  });
  it("normalizes whitespace and falls back to Unknown", () => {
    expect(cleanStream("  Trades   Occupations ")).toBe("Trades Occupations");
    expect(cleanStream("")).toBe("Unknown");
    expect(cleanStream(undefined)).toBe("Unknown");
  });
  it("rejects markup, bidi tricks and non-strings without echoing them", () => {
    for (const bad of ["<b>x</b>", "abc\u202Edef", "www.evil.example", { toString: () => "x" }]) {
      if (typeof bad !== "string") {
        expect(cleanStream(bad)).toBe("Unknown");
        continue;
      }
      expect(() => cleanStream(bad), bad).toThrow(/^unexpected stream name in IRCC feed/);
    }
  });
});

describe("assertNotOlder", () => {
  const rounds = (n: number) => [{ drawNumber: n }];
  it("allows newer or corrected data, including a first refresh", () => {
    expect(() => assertNotOlder(rounds(440), rounds(447))).not.toThrow();
    expect(() => assertNotOlder(rounds(447), rounds(447))).not.toThrow();
    expect(() => assertNotOlder([], rounds(447))).not.toThrow();
  });
  it("refuses to roll the published draws back to a stale feed", () => {
    expect(() => assertNotOlder(rounds(447), rounds(440))).toThrow(/older than the published/);
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
