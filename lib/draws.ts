/**
 * Express Entry draw data, read from data/ee-draws.json.
 *
 * The site is a static export (GitHub Pages), so nothing is fetched at build
 * or request time. A daily GitHub Action runs scripts/policy-monitor.mjs
 * --update, which pulls IRCC's published rounds, rewrites the data file when
 * draws change, commits it and redeploys — the site is never more than about
 * a day behind IRCC.
 */

import type { DrawRound, DrawsData } from "@/lib/types";
import data from "@/data/ee-draws.json";

export function getDraws(): DrawsData {
  return { asOf: data.asOf, rounds: data.rounds as DrawRound[] };
}

/** Normalized stream keys used to match draws to a user's situation. */
export type StreamKey =
  | "cec"
  | "pnp"
  | "french"
  | "healthcare"
  | "stem"
  | "trades"
  | "education"
  | "agriculture"
  | "general";

export function streamKey(name: string): StreamKey {
  const n = name.toLowerCase();
  // Must not match category draws like "Senior managers with Canadian Work
  // Experience" — only the program itself.
  if (n.includes("canadian experience class")) return "cec";
  if (n.includes("provincial")) return "pnp";
  if (n.includes("french")) return "french";
  if (n.includes("health")) return "healthcare";
  if (n.includes("stem")) return "stem";
  if (n.includes("trade")) return "trades";
  if (n.includes("education")) return "education";
  if (n.includes("agri")) return "agriculture";
  return "general";
}

/** Most recent round per normalized stream. */
export function latestByStream(draws: DrawsData): Partial<Record<StreamKey, DrawRound>> {
  const out: Partial<Record<StreamKey, DrawRound>> = {};
  for (const round of draws.rounds) {
    const key = streamKey(round.stream);
    if (!out[key]) out[key] = round; // rounds arrive newest-first
  }
  return out;
}
