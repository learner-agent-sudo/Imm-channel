/**
 * Core domain types for the Imm Channel pathway planner.
 *
 * Privacy principle: a Profile contains only the minimum facts needed to
 * evaluate immigration programs. No names, no contact info, no document
 * numbers. Profiles live in the browser and are never sent to a server.
 */

export type MaritalStatus = "single" | "married";

/** Education levels aligned with IRCC's CRS / FSW credential categories. */
export type EducationLevel =
  | "less-than-secondary"
  | "secondary"
  | "one-year-post-secondary"
  | "two-year-post-secondary"
  | "bachelors" // three-year or longer post-secondary credential
  | "two-or-more-credentials" // one of which is 3+ years
  | "masters-or-professional"
  | "doctoral";

/** Canadian Language Benchmark (or NCLC for French) per ability. */
export interface CLBScores {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}

export type LanguageTest =
  | "ielts-general"
  | "celpip-general"
  | "pte-core"
  | "self-estimate" // user picks CLB directly
  | "nclc-direct"; // French: user enters NCLC from TEF/TCF report

/** NOC 2021 TEER category of the user's main occupation. */
export type Teer = 0 | 1 | 2 | 3 | 4 | 5;

/** Express Entry category-based selection groups (occupation-based ones). */
export type OccupationCategory =
  | "none"
  | "healthcare"
  | "stem"
  | "trades"
  | "education"
  | "agriculture";

export type InCanadaStatus = "outside" | "visitor" | "student" | "worker";

/**
 * Citizenship matters only where IRCC runs nationality-specific measures.
 * "other" is the default and is never transmitted anywhere.
 */
export type Citizenship = "other" | "hong-kong" | "ukraine" | "afghanistan";

export type FundsBand =
  | "under-10k"
  | "10k-16k"
  | "16k-30k"
  | "30k-60k"
  | "over-60k";

export interface SpouseProfile {
  education: EducationLevel;
  /** CLB of the spouse's official-language test, null if none/unknown. */
  clb: CLBScores | null;
  canadianWorkYears: number;
}

export interface Profile {
  age: number;
  maritalStatus: MaritalStatus;
  /** Only meaningful when married: will the spouse immigrate too? */
  spouseAccompanying: boolean;
  spouse: SpouseProfile | null;

  education: EducationLevel;
  /** Years of full-time study completed in Canada, as credential length. */
  canadianCredential: "none" | "one-or-two-year" | "three-plus-year";

  /** First official language CLB (English or French). */
  firstLanguage: { lang: "en" | "fr"; clb: CLBScores } | null;
  /** Second official language CLB, if tested. */
  secondLanguage: { lang: "en" | "fr"; clb: CLBScores } | null;

  /** Full-time-equivalent years of skilled (TEER 0–3) work outside Canada. */
  foreignWorkYears: number;
  /** Full-time-equivalent years of skilled (TEER 0–3) work inside Canada. */
  canadianWorkYears: number;
  /** TEER of the main occupation, null if no skilled work yet. */
  teer: Teer | null;
  occupationCategory: OccupationCategory;
  /** Certificate of qualification in a skilled trade from a province. */
  tradesCertificate: boolean;

  hasJobOffer: boolean;
  siblingInCanada: boolean;
  inCanadaStatus: InCanadaStatus;
  fundsBand: FundsBand;
  /** Open to studying in Canada as a route to PR. */
  openToStudy: boolean;
  citizenship: Citizenship;
  /** Recognized refugee or displaced-person status (UNHCR or similar). */
  refugeeStatus: boolean;
}

/* ----------------------------- Results types ----------------------------- */

export interface CRSBreakdown {
  coreHumanCapital: {
    age: number;
    education: number;
    firstLanguage: number;
    secondLanguage: number;
    canadianWork: number;
    subtotal: number;
  };
  spouseFactors: {
    education: number;
    language: number;
    canadianWork: number;
    subtotal: number;
  };
  skillTransferability: {
    educationLanguage: number;
    educationCanadianWork: number;
    foreignWorkLanguage: number;
    foreignWorkCanadianWork: number;
    certificateLanguage: number;
    subtotal: number; // capped at 100
  };
  additional: {
    canadianStudy: number;
    french: number;
    sibling: number;
    provincialNomination: number;
    subtotal: number;
  };
  total: number;
}

export interface RequirementCheck {
  met: boolean;
  label: string;
  detail?: string;
}

export interface ProgramEligibility {
  programId: "fsw" | "cec" | "fst";
  programName: string;
  eligible: boolean;
  checks: RequirementCheck[];
  /** FSW only: points on the 67-point selection grid. */
  gridPoints?: number;
}

export interface CRSBooster {
  label: string;
  detail: string;
  /** CRS points gained vs the current score (approx). */
  delta: number;
}

export interface RoadmapStep {
  title: string;
  detail: string;
  /** Range in months; [0, 0] for instantaneous/administrative steps. */
  monthsMin: number;
  monthsMax: number;
  officialLink?: string;
  /** Internal route to a detailed how-to guide (e.g. /guides/study-permit). */
  guide?: string;
}

export type PathwayStatus =
  | "ready" // eligible and competitive today
  | "action-needed" // eligible or near-eligible after concrete steps
  | "long-term" // multi-year route (e.g. study pathway)
  | "not-viable"; // requirements can't be met on this profile

export interface PathwayPlan {
  id: string;
  title: string;
  tagline: string;
  status: PathwayStatus;
  /** Lower rank = better recommendation. */
  rank: number;
  steps: RoadmapStep[];
  monthsToPRMin: number;
  monthsToPRMax: number;
  monthsToCitizenshipMin: number;
  monthsToCitizenshipMax: number;
  estCostMinCAD: number;
  estCostMaxCAD: number;
  requirements: RequirementCheck[];
  caveats: string[];
  /** Only for Express-Entry-based pathways. */
  crs?: number;
  projectedCrs?: number;
  drawComparison?: DrawComparison[];
}

export interface DrawComparison {
  stream: string;
  recentCutoff: number;
  drawDate: string;
  userScore: number;
  competitive: "above" | "close" | "below";
}

/**
 * Informational card for special measures that don't produce a full plan
 * (closed programs, pilots with shifting intakes, status-based measures).
 */
export interface SpecialNotice {
  id: string;
  title: string;
  summary: string;
  status: "open" | "closed" | "check";
  link: string;
}

export interface PlannerResult {
  crs: CRSBreakdown;
  fswGridPoints: number;
  programs: ProgramEligibility[];
  pathways: PathwayPlan[];
  boosters: CRSBooster[];
  notices: SpecialNotice[];
}

/* --------------------------- Policy data types --------------------------- */

export interface RuleSource {
  label: string;
  url: string;
  /** ISO date this value was last manually verified against the source. */
  lastVerified: string;
}

export interface DrawRound {
  drawNumber: number;
  date: string;
  stream: string;
  invitations: number;
  cutoff: number;
}

export interface DrawsData {
  source: "live" | "snapshot";
  asOf: string;
  rounds: DrawRound[];
}

export interface PolicyUpdate {
  date: string;
  title: string;
  summary: string;
  affects: string[];
  sourceUrl: string;
}
