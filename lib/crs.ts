/**
 * Comprehensive Ranking System (CRS) calculator.
 *
 * Implements IRCC's CRS grid (see sources.crsGrid in lib/rules/parameters.ts):
 *  A. Core / human capital factors
 *  B. Spouse or common-law partner factors
 *  C. Skill transferability factors (capped at 100)
 *  D. Additional points (provincial nomination, Canadian study, French, sibling)
 *
 * Note: arranged-employment (job offer) points were removed by IRCC on
 * 2025-03-25 and are intentionally absent.
 */

import type { CLBScores, CRSBreakdown, EducationLevel, Profile } from "@/lib/types";
import { minCLB } from "@/lib/language";

/* ------------------------------- A. Core ------------------------------- */

// [withSpouse, single]
const AGE_POINTS: Record<number, [number, number]> = {
  18: [90, 99],
  19: [95, 105],
  20: [100, 110],
  21: [100, 110],
  22: [100, 110],
  23: [100, 110],
  24: [100, 110],
  25: [100, 110],
  26: [100, 110],
  27: [100, 110],
  28: [100, 110],
  29: [100, 110],
  30: [95, 105],
  31: [90, 99],
  32: [85, 94],
  33: [80, 88],
  34: [75, 83],
  35: [70, 77],
  36: [65, 72],
  37: [60, 66],
  38: [55, 61],
  39: [50, 55],
  40: [45, 50],
  41: [35, 39],
  42: [25, 28],
  43: [15, 17],
  44: [5, 6],
};

const EDUCATION_POINTS: Record<EducationLevel, [number, number]> = {
  "less-than-secondary": [0, 0],
  secondary: [28, 30],
  "one-year-post-secondary": [84, 90],
  "two-year-post-secondary": [91, 98],
  bachelors: [112, 120],
  "two-or-more-credentials": [119, 128],
  "masters-or-professional": [126, 135],
  doctoral: [140, 150],
};

// First official language, per ability: [withSpouse, single]
function firstLangAbilityPoints(clb: number, withSpouse: boolean): number {
  const table: [number, [number, number]][] = [
    [10, [32, 34]],
    [9, [29, 31]],
    [8, [22, 23]],
    [7, [16, 17]],
    [6, [8, 9]],
    [4, [6, 6]],
  ];
  for (const [min, [spouse, single]] of table) {
    if (clb >= min) return withSpouse ? spouse : single;
  }
  return 0;
}

// Second official language, per ability (same for both, but capped differently)
function secondLangAbilityPoints(clb: number): number {
  if (clb >= 9) return 6;
  if (clb >= 7) return 3;
  if (clb >= 5) return 1;
  return 0;
}

// Canadian skilled work experience: [withSpouse, single]
function canadianWorkPoints(years: number, withSpouse: boolean): number {
  const table: [number, [number, number]][] = [
    [5, [70, 80]],
    [4, [63, 72]],
    [3, [56, 64]],
    [2, [46, 53]],
    [1, [35, 40]],
  ];
  for (const [min, [spouse, single]] of table) {
    if (years >= min) return withSpouse ? spouse : single;
  }
  return 0;
}

/* ------------------------------ B. Spouse ------------------------------ */

const SPOUSE_EDUCATION_POINTS: Record<EducationLevel, number> = {
  "less-than-secondary": 0,
  secondary: 2,
  "one-year-post-secondary": 6,
  "two-year-post-secondary": 7,
  bachelors: 8,
  "two-or-more-credentials": 9,
  "masters-or-professional": 10,
  doctoral: 10,
};

function spouseLangAbilityPoints(clb: number): number {
  if (clb >= 9) return 5;
  if (clb >= 7) return 3;
  if (clb >= 5) return 1;
  return 0;
}

function spouseCanadianWorkPoints(years: number): number {
  if (years >= 5) return 10;
  if (years >= 4) return 9;
  if (years >= 3) return 8;
  if (years >= 2) return 7;
  if (years >= 1) return 5;
  return 0;
}

/* ----------------------- C. Skill transferability ----------------------- */

type EduGroup = "none" | "one-credential" | "two-or-advanced";

function eduGroup(level: EducationLevel): EduGroup {
  if (level === "less-than-secondary" || level === "secondary") return "none";
  if (
    level === "two-or-more-credentials" ||
    level === "masters-or-professional" ||
    level === "doctoral"
  ) {
    return "two-or-advanced";
  }
  return "one-credential";
}

/** Education combined with language (CLB 7+ all → tier 1, CLB 9+ all → tier 2). */
function educationLanguageTransfer(level: EducationLevel, clb: CLBScores): number {
  const group = eduGroup(level);
  if (group === "none") return 0;
  const m = minCLB(clb);
  if (m >= 9) return group === "two-or-advanced" ? 50 : 25;
  if (m >= 7) return group === "two-or-advanced" ? 25 : 13;
  return 0;
}

function educationCanadianWorkTransfer(level: EducationLevel, cdnYears: number): number {
  const group = eduGroup(level);
  if (group === "none" || cdnYears < 1) return 0;
  if (cdnYears >= 2) return group === "two-or-advanced" ? 50 : 25;
  return group === "two-or-advanced" ? 25 : 13;
}

function foreignWorkLanguageTransfer(foreignYears: number, clb: CLBScores): number {
  if (foreignYears < 1) return 0;
  const m = minCLB(clb);
  const strong = foreignYears >= 3;
  if (m >= 9) return strong ? 50 : 25;
  if (m >= 7) return strong ? 25 : 13;
  return 0;
}

function foreignCanadianWorkTransfer(foreignYears: number, cdnYears: number): number {
  if (foreignYears < 1 || cdnYears < 1) return 0;
  const strong = foreignYears >= 3;
  if (cdnYears >= 2) return strong ? 50 : 25;
  return strong ? 25 : 13;
}

function certificateLanguageTransfer(hasCert: boolean, clb: CLBScores): number {
  if (!hasCert) return 0;
  const m = minCLB(clb);
  if (m >= 7) return 50;
  if (m >= 5) return 25;
  return 0;
}

/* ---------------------------- D. Additional ---------------------------- */

function canadianStudyPoints(credential: Profile["canadianCredential"]): number {
  if (credential === "three-plus-year") return 30;
  if (credential === "one-or-two-year") return 15;
  return 0;
}

/**
 * French-language bonus: NCLC 7+ in all four French abilities earns
 * +50 with English CLB 5+ (all four), otherwise +25.
 */
function frenchPoints(profile: Profile): number {
  const langs = [profile.firstLanguage, profile.secondLanguage].filter(
    (l): l is NonNullable<typeof l> => l !== null,
  );
  const french = langs.find((l) => l.lang === "fr");
  const english = langs.find((l) => l.lang === "en");
  if (!french || minCLB(french.clb) < 7) return 0;
  if (english && minCLB(english.clb) >= 5) return 50;
  return 25;
}

/* ------------------------------- Compute ------------------------------- */

const ZERO_CLB: CLBScores = { listening: 0, reading: 0, writing: 0, speaking: 0 };

export interface CRSOptions {
  /** Add the +600 provincial nomination bonus. */
  withProvincialNomination?: boolean;
}

export function calculateCRS(profile: Profile, options: CRSOptions = {}): CRSBreakdown {
  const withSpouse = profile.maritalStatus === "married" && profile.spouseAccompanying;
  const firstCLB = profile.firstLanguage?.clb ?? ZERO_CLB;
  const abilities = ["listening", "reading", "writing", "speaking"] as const;

  // A. Core / human capital
  const agePts = (AGE_POINTS[profile.age] ?? [0, 0])[withSpouse ? 0 : 1];
  const eduPts = EDUCATION_POINTS[profile.education][withSpouse ? 0 : 1];
  const firstLangPts = abilities.reduce(
    (sum, a) => sum + firstLangAbilityPoints(firstCLB[a], withSpouse),
    0,
  );
  const secondLangCap = withSpouse ? 22 : 24;
  const secondLangPts = profile.secondLanguage
    ? Math.min(
        secondLangCap,
        abilities.reduce(
          (sum, a) => sum + secondLangAbilityPoints(profile.secondLanguage!.clb[a]),
          0,
        ),
      )
    : 0;
  const cdnWorkPts = canadianWorkPoints(profile.canadianWorkYears, withSpouse);

  // B. Spouse factors
  let spouseEdu = 0;
  let spouseLang = 0;
  let spouseWork = 0;
  if (withSpouse && profile.spouse) {
    spouseEdu = SPOUSE_EDUCATION_POINTS[profile.spouse.education];
    const sClb = profile.spouse.clb;
    spouseLang = sClb
      ? abilities.reduce((sum, a) => sum + spouseLangAbilityPoints(sClb[a]), 0)
      : 0;
    spouseWork = spouseCanadianWorkPoints(profile.spouse.canadianWorkYears);
  }

  // C. Skill transferability (pairwise caps of 50, total cap 100)
  const eduLang = educationLanguageTransfer(profile.education, firstCLB);
  const eduCdn = educationCanadianWorkTransfer(profile.education, profile.canadianWorkYears);
  const educationPair = Math.min(50, eduLang + eduCdn);
  const forLang = foreignWorkLanguageTransfer(profile.foreignWorkYears, firstCLB);
  const forCdn = foreignCanadianWorkTransfer(
    profile.foreignWorkYears,
    profile.canadianWorkYears,
  );
  const foreignPair = Math.min(50, forLang + forCdn);
  const certLang = certificateLanguageTransfer(profile.tradesCertificate, firstCLB);
  const transferSubtotal = Math.min(100, educationPair + foreignPair + certLang);

  // D. Additional points (max 600)
  const study = canadianStudyPoints(profile.canadianCredential);
  const french = frenchPoints(profile);
  const sibling = profile.siblingInCanada ? 15 : 0;
  const nomination = options.withProvincialNomination ? 600 : 0;
  const additionalSubtotal = Math.min(600, study + french + sibling + nomination);

  const coreSubtotal = agePts + eduPts + firstLangPts + secondLangPts + cdnWorkPts;
  const spouseSubtotal = spouseEdu + spouseLang + spouseWork;

  return {
    coreHumanCapital: {
      age: agePts,
      education: eduPts,
      firstLanguage: firstLangPts,
      secondLanguage: secondLangPts,
      canadianWork: cdnWorkPts,
      subtotal: coreSubtotal,
    },
    spouseFactors: {
      education: spouseEdu,
      language: spouseLang,
      canadianWork: spouseWork,
      subtotal: spouseSubtotal,
    },
    skillTransferability: {
      educationLanguage: eduLang,
      educationCanadianWork: eduCdn,
      foreignWorkLanguage: forLang,
      foreignWorkCanadianWork: forCdn,
      certificateLanguage: certLang,
      subtotal: transferSubtotal,
    },
    additional: {
      canadianStudy: study,
      french,
      sibling,
      provincialNomination: nomination,
      subtotal: additionalSubtotal,
    },
    total: coreSubtotal + spouseSubtotal + transferSubtotal + additionalSubtotal,
  };
}
