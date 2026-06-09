/**
 * Express Entry draw data: live from IRCC's published JSON when reachable,
 * with the bundled snapshot as fallback. Server-side only.
 */

import type { DrawRound, DrawsData } from "@/lib/types";
import snapshot from "@/data/ee-draws-snapshot.json";

const IRCC_ROUNDS_URL =
  "https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json";

interface IrccRound {
  drawNumber?: string;
  drawDate?: string;
  drawName?: string;
  drawSize?: string;
  drawCRS?: string;
}

function parseIrccRounds(raw: unknown): DrawRound[] {
  const rounds = (raw as { rounds?: IrccRound[] })?.rounds;
  if (!Array.isArray(rounds)) throw new Error("unexpected IRCC rounds format");
  return rounds
    .slice(0, 20)
    .map((r) => ({
      drawNumber: parseInt(String(r.drawNumber ?? "0").replace(/\D/g, ""), 10),
      date: String(r.drawDate ?? ""),
      stream: String(r.drawName ?? "Unknown"),
      invitations: parseInt(String(r.drawSize ?? "0").replace(/\D/g, ""), 10) || 0,
      cutoff: parseInt(String(r.drawCRS ?? "0").replace(/\D/g, ""), 10) || 0,
    }))
    .filter((r) => r.cutoff > 0 && r.date !== "");
}

export function getSnapshotDraws(): DrawsData {
  return {
    source: "snapshot",
    asOf: snapshot.asOf,
    rounds: snapshot.rounds as DrawRound[],
  };
}

export async function getDraws(): Promise<DrawsData> {
  try {
    const res = await fetch(IRCC_ROUNDS_URL, {
      next: { revalidate: 21600 }, // refresh at most every 6 hours
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`IRCC feed returned ${res.status}`);
    const rounds = parseIrccRounds(await res.json());
    if (rounds.length === 0) throw new Error("IRCC feed returned no rounds");
    return {
      source: "live",
      asOf: new Date().toISOString().slice(0, 10),
      rounds,
    };
  } catch {
    // Network blocked or feed changed shape — fall back to the bundled snapshot.
    return getSnapshotDraws();
  }
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
  if (n.includes("experience")) return "cec";
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
