/**
 * Nationality- and status-based special measures.
 *
 * These pathways sit outside the points system: the Hong Kong public policy
 * (Streams A and B) needs only CLB 5 and no CRS score at all, which makes it
 * the best route for eligible people even when Express Entry looks viable.
 * Time-limited measures carry explicit expiry caveats — the policy monitor
 * watches for extensions or closures.
 */

import type { PathwayPlan, Profile, RoadmapStep, SpecialNotice } from "@/lib/types";
import { minCLB } from "@/lib/language";
import { calculateCRS } from "@/lib/crs";
import { citizenshipSteps, eeCosts, sumSteps } from "@/lib/plan-shared";
import {
  fees,
  hkPathway,
  iecRule,
  processing,
  sources,
  studyCostOfLiving,
  thirdPartyCosts,
} from "@/lib/rules/parameters";

export interface SpecialPrograms {
  pathways: PathwayPlan[];
  notices: SpecialNotice[];
}

/* ----------------------------- Hong Kong ------------------------------ */

function hkLanguageOk(profile: Profile): boolean {
  const langs = [profile.firstLanguage, profile.secondLanguage];
  return langs.some((l) => l !== null && minCLB(l.clb) >= hkPathway.minCLB);
}

function hkExpiryCaveat(): string {
  return `The Hong Kong public policy is time-limited (currently set to expire ${hkPathway.policyExpiry}). Apply well before the deadline and verify the current status on IRCC's page — extensions and closures are exactly what our policy monitor watches for.`;
}

function hkApplicationStep(stream: "A" | "B"): RoadmapStep {
  return {
    title: `Apply for PR under Hong Kong Stream ${stream}`,
    detail:
      stream === "A"
        ? "Stream A is for recent graduates of Canadian institutions: a degree, a 2+ year diploma, or a 1+ year graduate credential earned in Canada within the last 3 years. CLB/NCLC 5 only — no points grid, no draw."
        : "Stream B needs 1 year (1,560 hours) of full-time-equivalent work in Canada within the last 3 years — any work counts since the education requirement was removed. CLB/NCLC 5 only — no points grid, no draw.",
    monthsMin: hkPathway.processingMonths[0],
    monthsMax: hkPathway.processingMonths[1],
    officialLink: sources.hkPathway.url,
  };
}

function hkStreamBNow(profile: Profile): PathwayPlan {
  const steps: RoadmapStep[] = [
    {
      title: "Confirm your documents",
      detail:
        "A valid HKSAR or BNO passport, language results at CLB/NCLC 5+ (less than 2 years old), and proof of your 1+ year of work in Canada. You must be in Canada with valid temporary status.",
      monthsMin: 0,
      monthsMax: 2,
      officialLink: sources.hkPathway.url,
    },
    hkApplicationStep("B"),
    ...citizenshipSteps(Math.max(1, profile.canadianWorkYears)),
  ];
  const [mMin, mMax] = sumSteps(steps.slice(0, -2));
  const [cMin, cMax] = sumSteps(steps);
  return {
    id: "hk-stream-b",
    title: "Hong Kong pathway — Stream B (in-Canada work)",
    tagline: "You appear to qualify today: no CRS score, no draw, CLB 5 only.",
    status: "ready",
    rank: 0,
    steps,
    monthsToPRMin: mMin,
    monthsToPRMax: mMax,
    monthsToCitizenshipMin: cMin,
    monthsToCitizenshipMax: cMax,
    estCostMinCAD: fees.eePrincipalProcessing + fees.eeRightOfPermanentResidence + fees.biometricsPerPerson + thirdPartyCosts.medicalExam[0],
    estCostMaxCAD: fees.eePrincipalProcessing + fees.eeRightOfPermanentResidence + fees.biometricsPerPerson + thirdPartyCosts.medicalExam[1] + thirdPartyCosts.languageTest[1],
    requirements: [
      { met: true, label: "HKSAR or BNO passport holder" },
      {
        met: hkLanguageOk(profile),
        label: "CLB/NCLC 5+ in all four abilities (official test)",
      },
      {
        met: profile.canadianWorkYears >= 1,
        label: "1+ year (1,560 hours) of work in Canada in the last 3 years",
      },
      {
        met: profile.inCanadaStatus !== "outside",
        label: "In Canada with valid temporary resident status",
      },
    ],
    caveats: [hkExpiryCaveat()],
  };
}

function hkWorkTowardStreamB(profile: Profile): PathwayPlan {
  const monthsNeeded = Math.max(0, hkPathway.streamBWorkMonths - profile.canadianWorkYears * 12);
  const steps: RoadmapStep[] = [
    {
      title: "Work in Canada until you reach 1 year (1,560 hours)",
      detail:
        "Any paid work counts toward Stream B — it does not need to be skilled (TEER) work. Keep records: pay stubs, T4s, employment letters.",
      monthsMin: monthsNeeded,
      monthsMax: monthsNeeded + 3,
      officialLink: sources.hkPathway.url,
    },
    hkApplicationStep("B"),
    ...citizenshipSteps(1.5),
  ];
  const [mMin, mMax] = sumSteps(steps.slice(0, -2));
  const [cMin, cMax] = sumSteps(steps);
  return {
    id: "hk-stream-b-build",
    title: "Hong Kong pathway — build toward Stream B",
    tagline: "Finish 12 months of any work in Canada, then apply directly — no points race.",
    status: "action-needed",
    rank: 1,
    steps,
    monthsToPRMin: mMin,
    monthsToPRMax: mMax,
    monthsToCitizenshipMin: cMin,
    monthsToCitizenshipMax: cMax,
    estCostMinCAD: fees.eePrincipalProcessing + fees.eeRightOfPermanentResidence + fees.biometricsPerPerson + thirdPartyCosts.medicalExam[0],
    estCostMaxCAD: fees.eePrincipalProcessing + fees.eeRightOfPermanentResidence + fees.biometricsPerPerson + thirdPartyCosts.medicalExam[1] + thirdPartyCosts.languageTest[1],
    requirements: [
      { met: true, label: "HKSAR or BNO passport holder" },
      {
        met: profile.inCanadaStatus === "worker" || profile.inCanadaStatus === "student",
        label: "Authorized to work in Canada now",
        detail:
          profile.inCanadaStatus === "outside"
            ? "You'd first need a work or study permit to start accumulating hours — new Hong Kong open work permits closed in February 2025."
            : undefined,
      },
      {
        met: hkLanguageOk(profile),
        label: "CLB/NCLC 5+ (book a test if you haven't)",
      },
    ],
    caveats: [
      hkExpiryCaveat(),
      "Mind the timeline: you must finish the 12 months of work AND apply before the policy expires.",
    ],
  };
}

function hkStreamAViaStudy(profile: Profile): PathwayPlan {
  const steps: RoadmapStep[] = [
    {
      title: "Get admitted to a Canadian program (2-year diploma, degree, or 1-year graduate credential)",
      detail:
        "Stream A accepts a shorter range of credentials than PGWP planning requires — a 1-year post-graduate certificate qualifies if you already hold a degree.",
      monthsMin: 3,
      monthsMax: 6,
      officialLink: sources.hkPathway.url,
      guide: "/guides/study-permit",
    },
    {
      title: "Apply for a study permit",
      detail: `Show first-year tuition + $${studyCostOfLiving.toLocaleString()} cost-of-living funds + travel, plus a Provincial Attestation Letter in most cases.`,
      monthsMin: processing.studyPermit[0],
      monthsMax: processing.studyPermit[1],
      officialLink: sources.studyFunds.url,
      guide: "/guides/study-permit",
    },
    {
      title: "Complete your studies in Canada",
      detail: "Graduate from the program — Stream A requires applying within 3 years of graduation.",
      monthsMin: 12,
      monthsMax: 24,
    },
    hkApplicationStep("A"),
    ...citizenshipSteps(2),
  ];
  const [mMin, mMax] = sumSteps(steps.slice(0, -2));
  const [cMin, cMax] = sumSteps(steps);
  const tuition = thirdPartyCosts.collegeTuitionPerYear;
  return {
    id: "hk-stream-a",
    title: "Hong Kong pathway — Stream A (study in Canada)",
    tagline: "Graduate, then apply for PR directly — no work year, no CRS score needed.",
    status: "long-term",
    rank: 2,
    steps,
    monthsToPRMin: mMin,
    monthsToPRMax: mMax,
    monthsToCitizenshipMin: cMin,
    monthsToCitizenshipMax: cMax,
    estCostMinCAD: tuition[0] + fees.studyPermit + fees.eePrincipalProcessing + fees.eeRightOfPermanentResidence,
    estCostMaxCAD: tuition[1] * 2 + fees.studyPermit + fees.eePrincipalProcessing + fees.eeRightOfPermanentResidence + thirdPartyCosts.medicalExam[1],
    requirements: [
      { met: true, label: "HKSAR or BNO passport holder" },
      {
        met: hkLanguageOk(profile),
        label: "CLB/NCLC 5+ by the time you apply for PR",
      },
      {
        met: profile.fundsBand !== "under-10k" && profile.fundsBand !== "10k-16k",
        label: `Funds for study: first-year tuition + $${studyCostOfLiving.toLocaleString()} cost of living`,
      },
    ],
    caveats: [
      hkExpiryCaveat(),
      "Check that you can graduate AND apply before the policy expiry — a 1-year graduate certificate is the fastest qualifying credential.",
    ],
  };
}

/* --------------------------- IEC working holiday --------------------------- */

function iecAgeOk(profile: Profile): boolean {
  return profile.age >= iecRule.ageMin && profile.age <= Math.max(...iecRule.ageMaxByCountry);
}

/**
 * International Experience Canada: an open work permit by passport lottery —
 * no employer, no points. The most underrated route to Canadian experience
 * for the ~36 participating nationalities.
 */
function iecPathway(profile: Profile): PathwayPlan {
  const future: Profile = {
    ...profile,
    age: profile.age + 2,
    canadianWorkYears: Math.max(1, profile.canadianWorkYears),
    teer: profile.teer ?? 1,
    inCanadaStatus: "worker",
  };
  const projected = calculateCRS(future).total;
  const steps: RoadmapStep[] = [
    {
      title: "Enter the IEC pool for your country and get an invitation",
      detail:
        "Each participating country has its own quota, age cap (29, 30 or 35) and rounds. Working Holiday gives an OPEN work permit — no job offer needed. Pools typically open December–January; invitations flow through the year.",
      monthsMin: 1,
      monthsMax: 5,
      officialLink: sources.iec.url,
    },
    {
      title: "Land in Canada and work in a skilled job",
      detail:
        "The permit lasts 12–24 months depending on your country. Aim for TEER 0–3 work from day one: 12 months of skilled work makes you CEC-eligible and adds Canadian-experience CRS points.",
      monthsMin: 12,
      monthsMax: 14,
      officialLink: sources.cec.url,
    },
    {
      title: "Express Entry (CEC) — invitation, application, landing",
      detail: `Projected score after a year of Canadian work: ~${projected}. CEC draws favour exactly this profile; a second IEC year or employer permit bridges any gap.`,
      monthsMin: processing.expressEntryAfterITA[0],
      monthsMax: processing.expressEntryAfterITA[1] + 2,
      officialLink: sources.drawRounds.url,
      guide: "/guides/express-entry",
    },
    ...citizenshipSteps(1.5),
  ];
  const [mMin, mMax] = sumSteps(steps.slice(0, -2));
  const [cMin, cMax] = sumSteps(steps);
  const [costMin, costMax] = eeCosts(profile, false);
  return {
    id: "iec",
    title: "Working holiday (IEC) → CEC",
    tagline: "An open work permit by passport — earn Canadian experience without an employer or a study budget.",
    status: "action-needed",
    rank: 2,
    steps,
    monthsToPRMin: mMin,
    monthsToPRMax: mMax,
    monthsToCitizenshipMin: cMin,
    monthsToCitizenshipMax: cMax,
    estCostMinCAD: iecRule.participationFee + fees.openWorkPermitHolder + costMin,
    estCostMaxCAD: iecRule.participationFee + fees.openWorkPermitHolder + costMax + 2500, // flights, insurance, setup
    requirements: [
      { met: iecAgeOk(profile), label: "Aged 18–35 (some countries cap at 29 or 30)" },
      { met: true, label: "Passport from an IEC partner country", detail: "Check your country's quota and category on the IRCC page." },
      { met: true, label: "~$2,500 CAD settlement funds + health insurance for the stay" },
    ],
    caveats: [
      "Quotas are competitive for some countries (invitations are drawn by lottery) — enter the pool early in the season.",
      "Working holiday time also earns the half-day citizenship credit (max 1 year).",
    ],
    projectedCrs: projected,
  };
}

/* ------------------------------- Builder ------------------------------- */

export function buildSpecialPrograms(profile: Profile): SpecialPrograms {
  const pathways: PathwayPlan[] = [];
  const notices: SpecialNotice[] = [];

  if (profile.citizenship === "hong-kong") {
    const inCanada = profile.inCanadaStatus !== "outside";
    if (inCanada && profile.canadianWorkYears >= 1 && hkLanguageOk(profile)) {
      pathways.push(hkStreamBNow(profile));
    } else if (inCanada) {
      pathways.push(hkWorkTowardStreamB(profile));
    }
    if (profile.openToStudy) {
      pathways.push(hkStreamAViaStudy(profile));
    }
    notices.push({
      id: "hk-owp",
      title: "Hong Kong open work permits closed to new applicants",
      summary:
        "The dedicated Hong Kong open work permit stopped accepting new applications in February 2025. If you're outside Canada, the practical entry routes are a study permit (→ Stream A) or a regular employer-backed work permit (→ Stream B).",
      status: "closed",
      link: sources.hkPathway.url,
    });
  }

  if (profile.citizenship === "ukraine") {
    notices.push({
      id: "cuaet",
      title: "Ukraine measures (CUAET) — new applications closed",
      summary:
        "CUAET closed to new overseas applications in 2024; remaining measures mainly help CUAET holders already in Canada extend status. Permanent routes now run through the regular programs in your plan below — check IRCC's Ukraine page for anything newly announced.",
      status: "check",
      link: sources.ukraineMeasures.url,
    });
  }

  if (profile.citizenship === "afghanistan") {
    notices.push({
      id: "afghan",
      title: "Afghanistan special programs — resettlement commitment completed",
      summary:
        "The dedicated humanitarian programs reached their 40,000-person commitment and are closed to new applications. Family sponsorship, humanitarian & compassionate applications, and the regular economic programs below remain open.",
      status: "closed",
      link: sources.afghanistanMeasures.url,
    });
  }

  if (profile.citizenship === "sudan") {
    notices.push({
      id: "sudan",
      title: "Sudan — family-based humanitarian pathway (capped)",
      summary:
        "IRCC opened a family-based humanitarian pathway for people fleeing the conflict in Sudan with family in Canada; intake has been limited by caps and paused when full. If you have Canadian family, check the current intake status; otherwise the regular programs in your plan and a humanitarian & compassionate application are the open routes.",
      status: "check",
      link: sources.refugees.url,
    });
  }

  if (profile.citizenship === "haiti") {
    notices.push({
      id: "haiti",
      title: "Haiti — Americas humanitarian pathway closed",
      summary:
        "The 2023–24 humanitarian pathway for Haitian (and Colombian/Venezuelan) nationals with family in Canada reached its cap and closed. Family sponsorship, humanitarian & compassionate applications, and the regular economic programs below remain open.",
      status: "closed",
      link: sources.refugees.url,
    });
  }

  if (profile.citizenship === "iran") {
    notices.push({
      id: "iran",
      title: "Iran — temporary measures wound down",
      summary:
        "Special measures for Iranians already in Canada (fee-waived status extensions and open work permits) have largely ended. Check the current status if you're in Canada; otherwise your plan runs through the regular programs below.",
      status: "check",
      link: sources.refugees.url,
    });
  }

  if (profile.citizenship === "usa" || profile.citizenship === "mexico") {
    notices.push({
      id: "cusma",
      title: "CUSMA professional work permits — a faster work route",
      summary:
        "US and Mexican citizens with a job offer in a listed profession (engineers, accountants, computer/systems analysts, scientists, and ~60 more) can get an LMIA-exempt work permit — often processed at the border. That makes the work-permit-first route to CEC much faster than for other nationalities. Intra-company transfers are also available.",
      status: "open",
      link: sources.workPermits.url,
    });
  }

  if (profile.citizenship === "crisis-other") {
    notices.push({
      id: "crisis",
      title: "Country-specific crisis measures — check the current list",
      summary:
        "IRCC announces time-limited measures (status extensions, fee waivers, family-based pathways) for countries in crisis, and the list changes with events. Check the refugees & crisis page for your country, and note that a humanitarian & compassionate (H&C) application is always available for people already in Canada with compelling circumstances.",
      status: "check",
      link: sources.refugees.url,
    });
  }

  if (profile.refugeeStatus) {
    notices.push({
      id: "empp",
      title: "Routes for recognized refugees: EMPP, sponsorship, resettlement",
      summary:
        "Three doors: (1) the Economic Mobility Pathways Pilot lets skilled refugees use economic programs with relaxed rules — federal streams generally need a Canadian job offer and have caps; (2) private sponsorship (PSR) through a sponsoring group or Group of Five; (3) government-assisted resettlement via UNHCR referral. EMPP is the one you can actively drive — start with its current intake status.",
      status: "check",
      link: sources.empp.url,
    });
  }

  // IEC working holiday: passport-based, age-gated, and the cheapest way to
  // Canadian experience. A full pathway when confirmed, a pointer when unsure.
  const iecAge = iecAgeOk(profile);
  const abroad = profile.inCanadaStatus === "outside" || profile.inCanadaStatus === "visitor";
  if (profile.iecEligible === "yes" && iecAge && abroad) {
    pathways.push(iecPathway(profile));
  } else if (profile.iecEligible === "unsure" && iecAge && abroad) {
    notices.push({
      id: "iec-check",
      title: "Check if your passport qualifies for a working holiday (IEC)",
      summary:
        "About 36 countries have youth-mobility agreements with Canada (most of Europe, UK, Australia, Japan, Korea, Taiwan, Hong Kong, Chile, Costa Rica and more). If yours is on the list and you're within the age cap, an open 1–2 year work permit is often the fastest, cheapest start toward the Canadian Experience Class.",
      status: "check",
      link: sources.iec.url,
    });
  }

  return { pathways, notices };
}
