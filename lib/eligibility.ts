/**
 * Program eligibility checks for the three Express Entry programs.
 * Each check returns a structured pass/fail list so the UI can show the user
 * exactly what is missing — not just a yes/no.
 */

import type { Profile, ProgramEligibility, RequirementCheck } from "@/lib/types";
import { minCLB } from "@/lib/language";
import { calculateFSWGrid, FSW_PASS_MARK } from "@/lib/fsw";
import { proofOfFunds } from "@/lib/rules/parameters";

const FUNDS_BAND_MAX: Record<Profile["fundsBand"], number> = {
  "under-10k": 9_999,
  "10k-16k": 16_000,
  "16k-30k": 30_000,
  "30k-60k": 60_000,
  "over-60k": 1_000_000,
};

export function familySize(profile: Profile): number {
  return 1 + (profile.maritalStatus === "married" && profile.spouseAccompanying ? 1 : 0);
}

export function requiredFunds(profile: Profile): number {
  return proofOfFunds[Math.min(7, familySize(profile))];
}

function fundsCheck(profile: Profile): RequirementCheck {
  const required = requiredFunds(profile);
  // The funds requirement is waived for applicants authorized to work in
  // Canada who hold a valid job offer.
  if (profile.inCanadaStatus === "worker" && profile.hasJobOffer) {
    return {
      met: true,
      label: "Proof of settlement funds",
      detail: "Waived: you can legally work in Canada and have a valid job offer.",
    };
  }
  const met = FUNDS_BAND_MAX[profile.fundsBand] >= required;
  return {
    met,
    label: "Proof of settlement funds",
    detail: `IRCC currently requires about $${required.toLocaleString()} CAD for a family of ${familySize(profile)} — verify the exact amount on IRCC's proof-of-funds page.`,
  };
}

export function checkFSW(profile: Profile): ProgramEligibility {
  const firstCLB = profile.firstLanguage?.clb ?? null;
  const grid = calculateFSWGrid(profile);
  const skilledYears = profile.foreignWorkYears + profile.canadianWorkYears;

  const checks: RequirementCheck[] = [
    {
      met: skilledYears >= 1 && profile.teer !== null && profile.teer <= 3,
      label: "1+ year of continuous skilled work (TEER 0–3) in the last 10 years",
      detail:
        profile.teer !== null && profile.teer > 3
          ? "Your occupation is TEER 4–5, which doesn't count as skilled work for Express Entry."
          : undefined,
    },
    {
      met: firstCLB !== null && minCLB(firstCLB) >= 7,
      label: "Language: CLB 7 or higher in all four abilities",
    },
    {
      met: profile.education !== "less-than-secondary",
      label: "Secondary education or higher (foreign credentials need an ECA)",
    },
    fundsCheck(profile),
    {
      met: grid >= FSW_PASS_MARK,
      label: `Score ${FSW_PASS_MARK}+ on the selection grid (you score ~${grid})`,
    },
  ];

  return {
    programId: "fsw",
    programName: "Federal Skilled Worker",
    eligible: checks.every((c) => c.met),
    checks,
    gridPoints: grid,
  };
}

export function checkCEC(profile: Profile): ProgramEligibility {
  const firstCLB = profile.firstLanguage?.clb ?? null;
  const requiredCLB = profile.teer !== null && profile.teer <= 1 ? 7 : 5;

  const checks: RequirementCheck[] = [
    {
      met: profile.canadianWorkYears >= 1 && profile.teer !== null && profile.teer <= 3,
      label: "1+ year of skilled work (TEER 0–3) in Canada in the last 3 years",
      detail:
        profile.canadianWorkYears < 1
          ? "Work experience must be inside Canada with proper authorization. Experience gained while a full-time student doesn't count."
          : undefined,
    },
    {
      met: firstCLB !== null && minCLB(firstCLB) >= requiredCLB,
      label: `Language: CLB ${requiredCLB}+ in all abilities (based on your TEER ${profile.teer ?? "—"} occupation)`,
    },
  ];

  return {
    programId: "cec",
    programName: "Canadian Experience Class",
    eligible: checks.every((c) => c.met),
    checks,
  };
}

export function checkFST(profile: Profile): ProgramEligibility {
  const clb = profile.firstLanguage?.clb ?? null;
  const tradeYears = profile.foreignWorkYears + profile.canadianWorkYears;
  const isTrade = profile.occupationCategory === "trades" || profile.tradesCertificate;

  const checks: RequirementCheck[] = [
    {
      met: isTrade && tradeYears >= 2,
      label: "2+ years of experience in an eligible skilled trade in the last 5 years",
    },
    {
      met: profile.tradesCertificate || profile.hasJobOffer,
      label: "A provincial certificate of qualification OR a valid job offer",
    },
    {
      met: clb !== null && clb.speaking >= 5 && clb.listening >= 5 && clb.reading >= 4 && clb.writing >= 4,
      label: "Language: CLB 5 speaking/listening and CLB 4 reading/writing",
    },
    fundsCheck(profile),
  ];

  return {
    programId: "fst",
    programName: "Federal Skilled Trades",
    eligible: checks.every((c) => c.met),
    checks,
  };
}

export function checkAllPrograms(profile: Profile): ProgramEligibility[] {
  return [checkCEC(profile), checkFSW(profile), checkFST(profile)];
}
