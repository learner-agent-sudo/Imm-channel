import { describe, expect, it } from "vitest";
import { getDraws } from "@/lib/draws";

/**
 * Structural checks on data/ee-draws.json, which the daily refresh rewrites
 * automatically. The workflow runs these before committing new data, so a
 * malformed file never reaches the site. Only structure is checked — never
 * live values like cutoffs, which change with every draw.
 */
describe("data/ee-draws.json", () => {
  const draws = getDraws();
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;

  it("has a valid asOf date and a usable number of rounds", () => {
    expect(draws.asOf).toMatch(isoDate);
    expect(draws.rounds.length).toBeGreaterThanOrEqual(10);
  });

  it("lists rounds newest first with unique draw numbers", () => {
    const numbers = draws.rounds.map((r) => r.drawNumber);
    expect(new Set(numbers).size).toBe(numbers.length);
    expect([...numbers].sort((a, b) => b - a)).toEqual(numbers);
  });

  it("has well-formed rounds", () => {
    for (const round of draws.rounds) {
      expect(round.date).toMatch(isoDate);
      expect(round.stream.length).toBeGreaterThan(0);
      expect(round.invitations).toBeGreaterThanOrEqual(0);
      expect(round.cutoff).toBeGreaterThan(0);
      expect(round.cutoff).toBeLessThanOrEqual(1200);
    }
  });
});
