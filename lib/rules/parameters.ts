/**
 * Curated, versioned policy parameters.
 *
 * Every value here is human-maintained, carries a source URL and a
 * `lastVerified` date. The policy monitor (scripts/policy-monitor.mjs) watches
 * IRCC announcements and Express Entry draw data and opens a review task when
 * something may have changed — values are only edited after a human checks
 * the official source.
 *
 * NEVER present these numbers as authoritative: the UI must always link to
 * the official source and show the lastVerified date.
 */

import type { RuleSource } from "@/lib/types";

export const RULES_VERSION = "2026.06";

export const sources = {
  crsGrid: {
    label: "IRCC — Comprehensive Ranking System criteria",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.html",
    lastVerified: "2026-01-15",
  },
  fsw: {
    label: "IRCC — Federal Skilled Worker eligibility (67-point grid)",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/federal-skilled-workers.html",
    lastVerified: "2026-01-15",
  },
  cec: {
    label: "IRCC — Canadian Experience Class eligibility",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/canadian-experience-class.html",
    lastVerified: "2026-01-15",
  },
  fst: {
    label: "IRCC — Federal Skilled Trades eligibility",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/skilled-trades.html",
    lastVerified: "2026-01-15",
  },
  proofOfFunds: {
    label: "IRCC — Proof of funds for Express Entry",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html",
    lastVerified: "2026-01-15",
  },
  languageEquivalency: {
    label: "IRCC — Language test equivalency charts",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/test-equivalency-charts.html",
    lastVerified: "2026-01-15",
  },
  drawRounds: {
    label: "IRCC — Express Entry rounds of invitations",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds.html",
    lastVerified: "2026-01-15",
  },
  categoryBased: {
    label: "IRCC — Category-based selection",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/submit-profile/rounds-invitations/category-based-selection.html",
    lastVerified: "2026-01-15",
  },
  studyPermit: {
    label: "IRCC — Study permit",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html",
    lastVerified: "2026-01-15",
  },
  studyFunds: {
    label: "IRCC — Financial support for study permits",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html",
    lastVerified: "2026-01-15",
  },
  pgwp: {
    label: "IRCC — Post-graduation work permit eligibility",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html",
    lastVerified: "2026-01-15",
  },
  pnp: {
    label: "IRCC — Provincial Nominee Program",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html",
    lastVerified: "2026-01-15",
  },
  citizenship: {
    label: "IRCC — Citizenship eligibility",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-citizenship/become-canadian-citizen/eligibility.html",
    lastVerified: "2026-01-15",
  },
  fees: {
    label: "IRCC — Fee list",
    url: "https://ircc.canada.ca/english/information/fees/fees.asp",
    lastVerified: "2026-01-15",
  },
  processingTimes: {
    label: "IRCC — Check processing times",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-processing-times.html",
    lastVerified: "2026-01-15",
  },
  hkPathway: {
    label: "IRCC — Permanent residence pathways for Hong Kong residents",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/hong-kong-residents-permanent-residence.html",
    lastVerified: "2026-01-15",
  },
  ukraineMeasures: {
    label: "IRCC — Measures for Ukrainians (CUAET)",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/ukraine-measures.html",
    lastVerified: "2026-01-15",
  },
  afghanistanMeasures: {
    label: "IRCC — Programs for Afghan nationals",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/refugees/afghanistan.html",
    lastVerified: "2026-01-15",
  },
  empp: {
    label: "IRCC — Economic Mobility Pathways Pilot (skilled refugees)",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/refugees/economic-mobility-pathways-pilot.html",
    lastVerified: "2026-01-15",
  },
} satisfies Record<string, RuleSource>;

/**
 * Hong Kong public-policy pathways (Streams A and B).
 * The public policy is time-limited — verify expiry before relying on it.
 */
export const hkPathway = {
  policyExpiry: "2026-08-31",
  minCLB: 5,
  streamBWorkMonths: 12,
  processingMonths: [12, 24] as const,
};

/** Government fees in CAD. */
export const fees = {
  eePrincipalProcessing: 950,
  eeRightOfPermanentResidence: 575,
  eeSpouseProcessing: 950,
  eeSpouseRPRF: 575,
  eeDependentChild: 260,
  biometricsPerPerson: 85,
  studyPermit: 150,
  workPermit: 155,
  openWorkPermitHolder: 100,
  citizenshipAdult: 630,
};

/** Typical third-party costs in CAD (ranges, not government fees). */
export const thirdPartyCosts = {
  languageTest: [280, 420] as const,
  eca: [240, 420] as const, // credential assessment (WES, ICAS, etc.)
  medicalExam: [150, 350] as const,
  collegeTuitionPerYear: [16000, 25000] as const,
  universityTuitionPerYear: [25000, 45000] as const,
};

/**
 * Express Entry proof of funds (FSW/FST), by family size.
 * IRCC updates these every year (usually mid-year).
 */
export const proofOfFunds: Record<number, number> = {
  1: 15263,
  2: 19001,
  3: 23360,
  4: 28362,
  5: 32168,
  6: 36280,
  7: 40392,
};

/**
 * Study permit cost-of-living requirement (single applicant, outside Quebec),
 * excludes first-year tuition and travel.
 */
export const studyCostOfLiving = 22895;

/** Service standards / typical processing, in months. */
export const processing = {
  expressEntryAfterITA: [5, 8] as const, // 6-month service standard, often longer
  itaWait: [1, 6] as const, // pool wait depends entirely on draws
  ecaMonths: [1, 3] as const,
  languageTestMonths: [1, 3] as const, // booking + results
  studyPermit: [2, 4] as const,
  pgwpMonths: [2, 4] as const,
  pnpNomination: [6, 12] as const,
  citizenshipGrant: [8, 14] as const,
};

/** Citizenship physical-presence rule. */
export const citizenshipRule = {
  daysRequired: 1095,
  windowYears: 5,
  /** Pre-PR days in Canada count half, up to this many credited days. */
  maxPrePRCredit: 365,
  languageCLB: 4, // ages 18–54
};

/**
 * Express Entry category-based selection groups currently in use.
 * French-language proficiency is handled separately (language-based).
 */
export const activeCategories = [
  "french",
  "healthcare",
  "stem",
  "trades",
  "education",
  "agriculture",
] as const;

export const disclaimer =
  "Imm Channel is an independent informational tool. It is not affiliated " +
  "with IRCC or the Government of Canada, and nothing here is legal advice. " +
  "Program rules change frequently — always confirm on canada.ca, and " +
  "consider a licensed representative (RCIC or immigration lawyer) for " +
  "advice about your specific situation.";
