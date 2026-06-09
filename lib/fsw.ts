/**
 * Federal Skilled Worker 67-point selection grid (pass mark: 67).
 * See sources.fsw in lib/rules/parameters.ts.
 */

import type { Profile } from "@/lib/types";
import { minCLB } from "@/lib/language";

export const FSW_PASS_MARK = 67;

function languagePoints(profile: Profile): number {
  const first = profile.firstLanguage?.clb;
  if (!first) return 0;
  const perAbility = (clb: number) => (clb >= 9 ? 6 : clb >= 8 ? 5 : clb >= 7 ? 4 : 0);
  let pts =
    perAbility(first.listening) +
    perAbility(first.reading) +
    perAbility(first.writing) +
    perAbility(first.speaking);
  if (profile.secondLanguage && minCLB(profile.secondLanguage.clb) >= 5) pts += 4;
  return pts; // max 28
}

function educationPoints(profile: Profile): number {
  switch (profile.education) {
    case "doctoral":
      return 25;
    case "masters-or-professional":
      return 23;
    case "two-or-more-credentials":
      return 22;
    case "bachelors":
      return 21;
    case "two-year-post-secondary":
      return 19;
    case "one-year-post-secondary":
      return 15;
    case "secondary":
      return 5;
    default:
      return 0;
  }
}

function experiencePoints(profile: Profile): number {
  const years = profile.foreignWorkYears + profile.canadianWorkYears;
  if (years >= 6) return 15;
  if (years >= 4) return 13;
  if (years >= 2) return 11;
  if (years >= 1) return 9;
  return 0;
}

function agePoints(age: number): number {
  if (age < 18) return 0;
  if (age <= 35) return 12;
  if (age >= 47) return 0;
  return 12 - (age - 35); // 36 → 11, 37 → 10, … 46 → 1
}

function adaptabilityPoints(profile: Profile): number {
  let pts = 0;
  if (profile.canadianWorkYears >= 1) pts += 10;
  if (profile.canadianCredential !== "none") pts += 5;
  if (profile.siblingInCanada) pts += 5;
  if (profile.hasJobOffer) pts += 5;
  if (profile.spouseAccompanying && profile.spouse?.clb && minCLB(profile.spouse.clb) >= 4) {
    pts += 5;
  }
  if (profile.spouseAccompanying && (profile.spouse?.canadianWorkYears ?? 0) >= 1) pts += 5;
  return Math.min(10, pts);
}

export function calculateFSWGrid(profile: Profile): number {
  return (
    languagePoints(profile) +
    educationPoints(profile) +
    experiencePoints(profile) +
    agePoints(profile.age) +
    (profile.hasJobOffer ? 10 : 0) + // arranged employment
    adaptabilityPoints(profile)
  );
}
