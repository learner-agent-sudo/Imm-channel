import { describe, expect, it } from "vitest";
import { getDraws } from "@/lib/draws";
import monitorState from "@/data/monitor-state.json";
import { LIMITS, MAX_DRAW_GAP, STREAM_RE, isPlausibleDrawDate } from "@/scripts/ircc-draws.mjs";

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

  it("has consecutive draws whose dates don't run backwards", () => {
    for (let i = 0; i + 1 < draws.rounds.length; i++) {
      const [newer, older] = [draws.rounds[i], draws.rounds[i + 1]];
      expect(newer.drawNumber - older.drawNumber).toBeLessThanOrEqual(MAX_DRAW_GAP);
      expect(newer.date >= older.date, `${newer.drawNumber} vs ${older.drawNumber}`).toBe(true);
    }
  });

  it("has well-formed rounds", () => {
    for (const round of draws.rounds) {
      expect(isPlausibleDrawDate(round.date), round.date).toBe(true);
      expect(round.stream).toMatch(STREAM_RE);
      expect(Number.isInteger(round.drawNumber) && round.drawNumber > 0).toBe(true);
      expect(round.drawNumber).toBeLessThanOrEqual(LIMITS.drawNumber);
      expect(Number.isInteger(round.invitations) && round.invitations >= 0).toBe(true);
      expect(round.invitations).toBeLessThanOrEqual(LIMITS.invitations);
      expect(round.cutoff).toBeGreaterThan(0);
      expect(round.cutoff).toBeLessThanOrEqual(LIMITS.cutoff);
    }
  });
});

/**
 * data/monitor-state.json is the monitor's memory of what it already
 * reported. A corrupted value (a garbled draw number, a news date years in
 * the future) would silently suppress every later report, so it must stay
 * consistent with the draw data and the clock.
 */
describe("data/monitor-state.json", () => {
  it("tracks a draw number consistent with the draw data", () => {
    const newest = Math.max(...getDraws().rounds.map((r) => r.drawNumber));
    expect(Number.isInteger(monitorState.lastDrawNumber)).toBe(true);
    expect(monitorState.lastDrawNumber).toBeGreaterThanOrEqual(0);
    expect(monitorState.lastDrawNumber).toBeLessThanOrEqual(newest);
  });

  it("tracks a news date that isn't in the future", () => {
    const t = Date.parse(monitorState.lastNewsDate);
    expect(Number.isFinite(t)).toBe(true);
    expect(t).toBeLessThanOrEqual(Date.now() + 2 * 86400_000);
  });
});
