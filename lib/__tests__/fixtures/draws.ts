import type { DrawRound, DrawsData } from "@/lib/types";
import fixture from "./draws.json";

/**
 * Frozen draw data for tests. data/ee-draws.json is rewritten by the daily
 * refresh, so tests that read it would start failing whenever IRCC holds a
 * draw — and a failing test blocks the deploy.
 */
export const fixtureDraws: DrawsData = {
  asOf: fixture.asOf,
  rounds: fixture.rounds as DrawRound[],
};
