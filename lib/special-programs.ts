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
import { citizenshipSteps, sumSteps } from "@/lib/plan-shared";
import { fees, hkPathway, processing, sources, studyCostOfLiving, thirdPartyCosts } from "@/lib/rules/parameters";

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

  if (profile.refugeeStatus) {
    notices.push({
      id: "empp",
      title: "Economic Mobility Pathways Pilot (EMPP) — for skilled refugees",
      summary:
        "EMPP lets people with refugee or displaced-person status immigrate through economic programs with relaxed requirements (loan access, flexible proof of funds, NGO support). Federal streams generally need a Canadian job offer and have annual caps — check the current intake status.",
      status: "check",
      link: sources.empp.url,
    });
  }

  return { pathways, notices };
}
