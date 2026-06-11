/**
 * Helpers shared by the roadmap engine and the special-programs module.
 */

import type { Profile, RoadmapStep } from "@/lib/types";
import { citizenshipRule, fees, processing, sources, thirdPartyCosts } from "@/lib/rules/parameters";

export function sumSteps(steps: RoadmapStep[]): [number, number] {
  return [
    steps.reduce((s, x) => s + x.monthsMin, 0),
    steps.reduce((s, x) => s + x.monthsMax, 0),
  ];
}

/** Government + typical third-party costs for one Express Entry application. */
export function eeCosts(profile: Profile, includeEca: boolean): [number, number] {
  const adults =
    1 + (profile.maritalStatus === "married" && profile.spouseAccompanying ? 1 : 0);
  const children = Math.max(0, profile.dependentChildren);
  const fam = adults + children;
  const gov =
    (fees.eePrincipalProcessing + fees.eeRightOfPermanentResidence) * adults +
    fees.eeDependentChild * children +
    Math.min(fees.biometricsPerPerson * fam, fees.biometricsFamilyMax);
  const [testMin, testMax] = thirdPartyCosts.languageTest;
  const [medMin, medMax] = thirdPartyCosts.medicalExam;
  const [ecaMin, ecaMax] = includeEca ? thirdPartyCosts.eca : [0, 0];
  // Language tests are adults-only; medical exams cover every family member.
  return [
    gov + testMin * adults + medMin * fam + ecaMin,
    gov + testMax * adults + medMax * fam + ecaMax,
  ];
}

export function citizenshipSteps(prePRYearsInCanada: number): RoadmapStep[] {
  // Pre-PR days count half, up to 365 credited days (≈ shaves a year off).
  const credit = Math.min(12, Math.round(prePRYearsInCanada * 6));
  const presenceMonths = 36 - credit;
  return [
    {
      title: "Live in Canada as a permanent resident",
      detail:
        credit > 0
          ? `You need ${citizenshipRule.daysRequired} days (36 months) of physical presence in the 5 years before applying. Your time in Canada before PR counts at half-credit (max 1 year), so roughly ${presenceMonths} more months.`
          : `You need ${citizenshipRule.daysRequired} days (36 months) of physical presence in the 5 years before applying.`,
      monthsMin: presenceMonths,
      monthsMax: presenceMonths,
      officialLink: sources.citizenship.url,
    },
    {
      title: "Apply for citizenship, take the test and oath",
      detail: `CLB ${citizenshipRule.languageCLB} language proof and a citizenship test for ages 18–54. Fee: $${fees.citizenshipAdult} per adult.`,
      monthsMin: processing.citizenshipGrant[0],
      monthsMax: processing.citizenshipGrant[1],
      officialLink: sources.citizenship.url,
    },
  ];
}
