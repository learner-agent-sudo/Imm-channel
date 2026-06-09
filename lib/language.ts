/**
 * Language test score → Canadian Language Benchmark (CLB/NCLC) conversion.
 * Tables follow IRCC's official equivalency charts (see sources.languageEquivalency).
 *
 * French tests (TEF Canada / TCF Canada) report NCLC bands on the result
 * statement, so the UI asks for the NCLC level directly instead of raw scores.
 */

import type { CLBScores } from "@/lib/types";

type Ability = "listening" | "reading" | "writing" | "speaking";

/** Minimum raw score for each CLB level, from CLB 10 down to CLB 4. */
type Thresholds = Record<Ability, [clb: number, min: number][]>;

const IELTS_GENERAL: Thresholds = {
  listening: [
    [10, 8.5],
    [9, 8.0],
    [8, 7.5],
    [7, 6.0],
    [6, 5.5],
    [5, 5.0],
    [4, 4.5],
  ],
  reading: [
    [10, 8.0],
    [9, 7.0],
    [8, 6.5],
    [7, 6.0],
    [6, 5.0],
    [5, 4.0],
    [4, 3.5],
  ],
  writing: [
    [10, 7.5],
    [9, 7.0],
    [8, 6.5],
    [7, 6.0],
    [6, 5.5],
    [5, 5.0],
    [4, 4.0],
  ],
  speaking: [
    [10, 7.5],
    [9, 7.0],
    [8, 6.5],
    [7, 6.0],
    [6, 5.5],
    [5, 5.0],
    [4, 4.0],
  ],
};

const PTE_CORE: Thresholds = {
  listening: [
    [10, 89],
    [9, 82],
    [8, 71],
    [7, 60],
    [6, 50],
    [5, 39],
    [4, 28],
  ],
  reading: [
    [10, 88],
    [9, 78],
    [8, 69],
    [7, 60],
    [6, 51],
    [5, 42],
    [4, 33],
  ],
  writing: [
    [10, 90],
    [9, 88],
    [8, 79],
    [7, 69],
    [6, 60],
    [5, 51],
    [4, 41],
  ],
  speaking: [
    [10, 89],
    [9, 84],
    [8, 76],
    [7, 68],
    [6, 59],
    [5, 51],
    [4, 42],
  ],
};

function lookup(table: Thresholds, ability: Ability, raw: number): number {
  for (const [clb, min] of table[ability]) {
    if (raw >= min) return clb;
  }
  return 0;
}

export function ieltsToCLB(scores: CLBScores): CLBScores {
  return {
    listening: lookup(IELTS_GENERAL, "listening", scores.listening),
    reading: lookup(IELTS_GENERAL, "reading", scores.reading),
    writing: lookup(IELTS_GENERAL, "writing", scores.writing),
    speaking: lookup(IELTS_GENERAL, "speaking", scores.speaking),
  };
}

export function pteToCLB(scores: CLBScores): CLBScores {
  return {
    listening: lookup(PTE_CORE, "listening", scores.listening),
    reading: lookup(PTE_CORE, "reading", scores.reading),
    writing: lookup(PTE_CORE, "writing", scores.writing),
    speaking: lookup(PTE_CORE, "speaking", scores.speaking),
  };
}

/** CELPIP-General levels map 1:1 to CLB (12-point scale capped at 10+). */
export function celpipToCLB(scores: CLBScores): CLBScores {
  const cap = (n: number) => Math.max(0, Math.min(10, Math.floor(n)));
  return {
    listening: cap(scores.listening),
    reading: cap(scores.reading),
    writing: cap(scores.writing),
    speaking: cap(scores.speaking),
  };
}

export function minCLB(clb: CLBScores): number {
  return Math.min(clb.listening, clb.reading, clb.writing, clb.speaking);
}

/** Plain-language descriptions for the self-estimate option. */
export const clbSelfEstimateOptions = [
  { clb: 4, label: "Basic — simple everyday phrases, frequent mistakes" },
  { clb: 5, label: "Modest — routine conversations with effort" },
  { clb: 6, label: "Developing — comfortable in familiar situations" },
  { clb: 7, label: "Adequate — works/studies in the language with some errors" },
  { clb: 8, label: "Good — fluent in most settings, occasional slips" },
  { clb: 9, label: "Very good — near-effortless professional fluency" },
  { clb: 10, label: "Excellent — native-like in any context" },
] as const;
