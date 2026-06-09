/**
 * Roadmap engine: turns a profile + current draw data into ranked, multi-year
 * pathway plans that end at Canadian citizenship — the piece IRCC's
 * point-in-time eligibility checker doesn't do.
 */

import type {
  CRSBooster,
  DrawComparison,
  DrawRound,
  DrawsData,
  PathwayPlan,
  PlannerResult,
  Profile,
  RoadmapStep,
} from "@/lib/types";
import { calculateCRS } from "@/lib/crs";
import { calculateFSWGrid } from "@/lib/fsw";
import { checkAllPrograms, familySize, requiredFunds } from "@/lib/eligibility";
import { latestByStream, type StreamKey } from "@/lib/draws";
import { minCLB } from "@/lib/language";
import {
  citizenshipRule,
  fees,
  processing,
  sources,
  studyCostOfLiving,
  thirdPartyCosts,
} from "@/lib/rules/parameters";

/* ------------------------------- Helpers ------------------------------- */

function sumSteps(steps: RoadmapStep[]): [number, number] {
  return [
    steps.reduce((s, x) => s + x.monthsMin, 0),
    steps.reduce((s, x) => s + x.monthsMax, 0),
  ];
}

/** Government + typical third-party costs for one Express Entry application. */
function eeCosts(profile: Profile, includeEca: boolean): [number, number] {
  const fam = familySize(profile);
  const gov =
    (fees.eePrincipalProcessing + fees.eeRightOfPermanentResidence) * fam +
    fees.biometricsPerPerson * fam;
  const [testMin, testMax] = thirdPartyCosts.languageTest;
  const [medMin, medMax] = thirdPartyCosts.medicalExam;
  const [ecaMin, ecaMax] = includeEca ? thirdPartyCosts.eca : [0, 0];
  return [
    gov + testMin * fam + medMin * fam + ecaMin,
    gov + testMax * fam + medMax * fam + ecaMax,
  ];
}

function citizenshipSteps(prePRYearsInCanada: number): RoadmapStep[] {
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

function compareToDraws(
  crs: number,
  applicable: { key: StreamKey; label: string }[],
  latest: Partial<Record<StreamKey, DrawRound>>,
): DrawComparison[] {
  const out: DrawComparison[] = [];
  for (const { key, label } of applicable) {
    const round = latest[key];
    if (!round) continue;
    out.push({
      stream: label,
      recentCutoff: round.cutoff,
      drawDate: round.date,
      userScore: crs,
      competitive:
        crs >= round.cutoff ? "above" : crs >= round.cutoff - 30 ? "close" : "below",
    });
  }
  return out;
}

function applicableStreams(profile: Profile, cecEligible: boolean) {
  const streams: { key: StreamKey; label: string }[] = [];
  if (cecEligible) streams.push({ key: "cec", label: "Canadian Experience Class" });
  const langs = [profile.firstLanguage, profile.secondLanguage];
  const french = langs.find((l) => l?.lang === "fr");
  if (french && minCLB(french.clb) >= 7) {
    streams.push({ key: "french", label: "French proficiency category" });
  }
  const categoryLabels: Partial<Record<Profile["occupationCategory"], { key: StreamKey; label: string }>> = {
    healthcare: { key: "healthcare", label: "Healthcare & social services category" },
    stem: { key: "stem", label: "STEM category" },
    trades: { key: "trades", label: "Trades category" },
    education: { key: "education", label: "Education category" },
    agriculture: { key: "agriculture", label: "Agriculture & agri-food category" },
  };
  const cat = categoryLabels[profile.occupationCategory];
  if (cat) streams.push(cat);
  return streams;
}

/* ------------------------------ Boosters ------------------------------ */

function computeBoosters(profile: Profile, baseCrs: number): CRSBooster[] {
  const boosters: CRSBooster[] = [];
  const raise = (clb: typeof profile.firstLanguage, to: number) =>
    clb
      ? {
          ...clb,
          clb: {
            listening: Math.max(clb.clb.listening, to),
            reading: Math.max(clb.clb.reading, to),
            writing: Math.max(clb.clb.writing, to),
            speaking: Math.max(clb.clb.speaking, to),
          },
        }
      : clb;

  if (profile.firstLanguage && minCLB(profile.firstLanguage.clb) < 10) {
    const improved = calculateCRS({
      ...profile,
      firstLanguage: raise(profile.firstLanguage, 10),
    }).total;
    if (improved > baseCrs) {
      boosters.push({
        label: "Retake your language test, aim for CLB 10",
        detail:
          "Language is the highest-leverage factor: it scores directly and multiplies your education and work experience through skill-transferability points.",
        delta: improved - baseCrs,
      });
    }
  }

  const hasFrench7 = [profile.firstLanguage, profile.secondLanguage].some(
    (l) => l?.lang === "fr" && minCLB(l.clb) >= 7,
  );
  if (!hasFrench7) {
    const withFrench = calculateCRS({
      ...profile,
      secondLanguage: {
        lang: "fr",
        clb: { listening: 7, reading: 7, writing: 7, speaking: 7 },
      },
    }).total;
    boosters.push({
      label: "Learn French to NCLC 7",
      detail:
        "Adds bonus points and unlocks French-category draws, which have had much lower cutoffs than general rounds.",
      delta: withFrench - baseCrs,
    });
  }

  if (
    profile.education !== "masters-or-professional" &&
    profile.education !== "doctoral"
  ) {
    const withMasters = calculateCRS({
      ...profile,
      education: "masters-or-professional",
    }).total;
    if (withMasters > baseCrs) {
      boosters.push({
        label: "Complete a master's degree",
        detail: "Raises education points and skill-transferability combinations.",
        delta: withMasters - baseCrs,
      });
    }
  }

  if (profile.canadianWorkYears >= 0 && profile.canadianWorkYears < 5 && profile.inCanadaStatus === "worker") {
    const moreWork = calculateCRS({
      ...profile,
      canadianWorkYears: profile.canadianWorkYears + 1,
    }).total;
    if (moreWork > baseCrs) {
      boosters.push({
        label: "One more year of Canadian work experience",
        detail: "Canadian experience scores higher than foreign experience and compounds through transferability points.",
        delta: moreWork - baseCrs,
      });
    }
  }

  boosters.push({
    label: "Provincial nomination",
    detail:
      "An enhanced PNP nomination adds 600 points — effectively a guaranteed invitation. Streams vary by province and occupation.",
    delta: 600,
  });

  return boosters.sort((a, b) => b.delta - a.delta).slice(0, 4);
}

/* ------------------------------ Pathways ------------------------------ */

function expressEntryPathway(
  profile: Profile,
  crs: number,
  draws: DrawsData,
): PathwayPlan | null {
  const programs = checkAllPrograms(profile);
  const eligible = programs.filter((p) => p.eligible);
  if (eligible.length === 0) return null;

  const cecEligible = eligible.some((p) => p.programId === "cec");
  const comparison = compareToDraws(crs, applicableStreams(profile, cecEligible), latestByStream(draws));
  const best = comparison.find((c) => c.competitive === "above");
  const close = comparison.find((c) => c.competitive === "close");
  const needsEca = !cecEligible && profile.canadianCredential === "none";

  const steps: RoadmapStep[] = [
    {
      title: "Confirm language results",
      detail: "Test results (IELTS-G, CELPIP-G, PTE Core, TEF/TCF Canada) must be under 2 years old on the day you apply.",
      monthsMin: 0,
      monthsMax: processing.languageTestMonths[1],
      officialLink: sources.languageEquivalency.url,
    },
    ...(needsEca
      ? [{
          title: "Educational credential assessment (ECA)",
          detail: "WES, ICAS or another designated body verifies your foreign education.",
          monthsMin: processing.ecaMonths[0],
          monthsMax: processing.ecaMonths[1],
          officialLink: sources.fsw.url,
        }]
      : []),
    {
      title: "Create your Express Entry profile",
      detail: `You qualify for: ${eligible.map((p) => p.programName).join(", ")}. Your profile stays in the pool for 12 months.`,
      monthsMin: 0,
      monthsMax: 1,
      officialLink: sources.drawRounds.url,
    },
    {
      title: "Receive an invitation to apply (ITA)",
      detail: best
        ? `Your score is at or above the most recent ${best.stream} cutoff (${best.recentCutoff}).`
        : close
          ? `Your score is within ~30 points of the recent ${close.stream} cutoff (${close.recentCutoff}) — cutoffs move every round.`
          : "Your score is below recent cutoffs — see the boosters below or the PNP pathway.",
      monthsMin: processing.itaWait[0],
      monthsMax: processing.itaWait[1],
      officialLink: sources.drawRounds.url,
    },
    {
      title: "Submit PR application and land",
      detail: "60 days to submit after the ITA, then IRCC's 6-month service standard (often longer). Medical exam, police certificates and biometrics happen here.",
      monthsMin: processing.expressEntryAfterITA[0],
      monthsMax: processing.expressEntryAfterITA[1],
      officialLink: sources.processingTimes.url,
    },
    ...citizenshipSteps(profile.inCanadaStatus === "outside" ? 0 : 1),
  ];

  const [mMin, mMax] = sumSteps(steps.slice(0, -2));
  const [cMin, cMax] = sumSteps(steps);
  const [costMin, costMax] = eeCosts(profile, needsEca);

  return {
    id: "express-entry",
    title: "Express Entry — apply directly",
    tagline: best
      ? "You look competitive in a current draw stream."
      : close
        ? "Borderline: a small score boost would make you competitive."
        : "Eligible to enter the pool, but you'll need a higher score to be invited.",
    status: best ? "ready" : "action-needed",
    rank: best ? 1 : 2,
    steps,
    monthsToPRMin: mMin,
    monthsToPRMax: mMax,
    monthsToCitizenshipMin: cMin,
    monthsToCitizenshipMax: cMax,
    estCostMinCAD: costMin,
    estCostMaxCAD: costMax,
    requirements: eligible[0].checks,
    caveats: [
      "Most recent draws invite from the Canadian Experience Class, the PNP, and category-based streams; general draws for purely foreign profiles have been rare.",
      "Cutoffs change every round — treat the comparison as a signal, not a promise.",
    ],
    crs,
    drawComparison: comparison,
  };
}

function pnpPathway(profile: Profile, crs: number): PathwayPlan {
  const withNomination = crs + 600;
  const steps: RoadmapStep[] = [
    {
      title: "Shortlist provincial streams that want your occupation",
      detail: "Each province runs its own streams (e.g. Ontario HCP, BC Skills Immigration, Alberta Express Entry). Many select directly from the federal pool.",
      monthsMin: 1,
      monthsMax: 3,
      officialLink: sources.pnp.url,
    },
    {
      title: "Express interest / apply and receive a nomination",
      detail: "An 'enhanced' nomination adds 600 CRS points to your Express Entry profile — effectively guaranteeing an invitation.",
      monthsMin: processing.pnpNomination[0],
      monthsMax: processing.pnpNomination[1],
      officialLink: sources.pnp.url,
    },
    {
      title: "Express Entry with nomination — ITA and PR processing",
      detail: `Your score would be ~${withNomination} with the nomination bonus, far above PNP-stream cutoffs.`,
      monthsMin: processing.expressEntryAfterITA[0],
      monthsMax: processing.expressEntryAfterITA[1] + 1,
      officialLink: sources.drawRounds.url,
    },
    ...citizenshipSteps(profile.inCanadaStatus === "outside" ? 0 : 1),
  ];
  const [mMin, mMax] = sumSteps(steps.slice(0, -2));
  const [cMin, cMax] = sumSteps(steps);
  const [costMin, costMax] = eeCosts(profile, profile.canadianCredential === "none");

  return {
    id: "pnp",
    title: "Provincial Nominee Program + Express Entry",
    tagline: "The standard route when your score is below federal cutoffs.",
    status: "action-needed",
    rank: 3,
    steps,
    monthsToPRMin: mMin,
    monthsToPRMax: mMax,
    monthsToCitizenshipMin: cMin,
    monthsToCitizenshipMax: cMax,
    estCostMinCAD: costMin + 250, // typical provincial application fees vary widely
    estCostMaxCAD: costMax + 1500,
    requirements: [
      {
        met: profile.teer !== null && profile.teer <= 3,
        label: "A skilled occupation that appears on provincial in-demand lists",
      },
      {
        met: true,
        label: "Willingness to settle in the nominating province",
        detail: "You must genuinely intend to live there.",
      },
    ],
    caveats: [
      "Stream openings, occupation lists and quotas change frequently — check provinces directly.",
      "Provincial fees range from $0 to ~$1,500 depending on the province.",
    ],
    crs,
    projectedCrs: withNomination,
  };
}

function studyPathway(profile: Profile, draws: DrawsData): PathwayPlan {
  const masters =
    profile.education === "bachelors" ||
    profile.education === "two-or-more-credentials" ||
    profile.education === "masters-or-professional";
  const programYears = 2;
  const programLabel = masters
    ? "a master's degree (≈2 years)"
    : "a 2-year college diploma in a PGWP-eligible field";

  // Project the profile forward: older, with a Canadian credential and a year
  // of Canadian work — this is the number that makes the pathway concrete.
  const future: Profile = {
    ...profile,
    age: profile.age + programYears + 1,
    canadianWorkYears: Math.max(1, profile.canadianWorkYears),
    canadianCredential: masters ? "three-plus-year" : "one-or-two-year",
    education: masters ? "masters-or-professional" : profile.education,
    teer: profile.teer ?? 1,
    inCanadaStatus: "worker",
  };
  const projected = calculateCRS(future).total;
  const cutoffs = latestByStream(draws);
  const cecCutoff = cutoffs.cec?.cutoff;

  const tuition = masters
    ? thirdPartyCosts.universityTuitionPerYear
    : thirdPartyCosts.collegeTuitionPerYear;

  const steps: RoadmapStep[] = [
    {
      title: `Get admitted to ${programLabel}`,
      detail: "You need a letter of acceptance from a designated learning institution (DLI) plus a Provincial Attestation Letter (PAL) in most cases.",
      monthsMin: 3,
      monthsMax: 6,
      officialLink: sources.studyPermit.url,
    },
    {
      title: "Apply for a study permit",
      detail: `Show first-year tuition + $${studyCostOfLiving.toLocaleString()} cost-of-living funds + travel. College graduates later need a PGWP-eligible field of study — check before choosing a program.`,
      monthsMin: processing.studyPermit[0],
      monthsMax: processing.studyPermit[1],
      officialLink: sources.studyFunds.url,
    },
    {
      title: "Study in Canada",
      detail: "Full-time study; you can usually work up to 24 hours/week off campus.",
      monthsMin: programYears * 12,
      monthsMax: programYears * 12,
    },
    {
      title: "Post-graduation work permit (PGWP)",
      detail: masters
        ? "Master's graduates get a 3-year PGWP. Requires CLB 7."
        : "2-year programs earn a PGWP of up to 3 years. Requires CLB 5 and a field of study linked to shortage occupations.",
      monthsMin: 1,
      monthsMax: processing.pgwpMonths[1],
      officialLink: sources.pgwp.url,
    },
    {
      title: "Work 1 year in a skilled job, then Express Entry (CEC)",
      detail: `After 12 months of TEER 0–3 work you qualify for the Canadian Experience Class. Projected score then: ~${projected}${cecCutoff ? ` vs a recent CEC cutoff of ${cecCutoff}` : ""}.`,
      monthsMin: 12,
      monthsMax: 15,
      officialLink: sources.cec.url,
    },
    {
      title: "PR application",
      detail: "Invitation, application and processing under the CEC.",
      monthsMin: processing.expressEntryAfterITA[0],
      monthsMax: processing.expressEntryAfterITA[1],
    },
    ...citizenshipSteps(programYears + 1),
  ];

  const [mMin, mMax] = sumSteps(steps.slice(0, -2));
  const [cMin, cMax] = sumSteps(steps);
  const [eeMin, eeMax] = eeCosts(profile, false);

  return {
    id: "study",
    title: "Study pathway — student → PGWP → CEC",
    tagline: "Slower but the most reliable route when your current score can't win a draw.",
    status: "long-term",
    rank: 4,
    steps,
    monthsToPRMin: mMin,
    monthsToPRMax: mMax,
    monthsToCitizenshipMin: cMin,
    monthsToCitizenshipMax: cMax,
    estCostMinCAD: tuition[0] * programYears + fees.studyPermit + eeMin,
    estCostMaxCAD: tuition[1] * programYears + fees.studyPermit + eeMax,
    requirements: [
      {
        met: profile.fundsBand !== "under-10k" && profile.fundsBand !== "10k-16k",
        label: `Funds: first-year tuition + $${studyCostOfLiving.toLocaleString()} cost of living`,
        detail: "Roughly $40,000–$70,000 CAD available for year one.",
      },
      {
        met: profile.age <= 45,
        label: "Age still earns meaningful CRS points at graduation",
        detail: "CRS age points decline steeply after 35 — factor that into program length.",
      },
    ],
    caveats: [
      "Study permit approval is not guaranteed; refusal rates vary a lot by country and program.",
      "Choose the program for PGWP eligibility first, school brand second.",
      "Time in Canada before PR gives you a head start on citizenship (half-day credit, max 1 year).",
    ],
    projectedCrs: projected,
  };
}

function workPermitPathway(profile: Profile): PathwayPlan {
  const steps: RoadmapStep[] = [
    {
      title: "Employer obtains an LMIA and you apply for a work permit",
      detail: "Your employer must usually get a positive Labour Market Impact Assessment before you can apply.",
      monthsMin: 3,
      monthsMax: 7,
      officialLink: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit.html",
    },
    {
      title: "Work 12 months in a TEER 0–3 role",
      detail: "This makes you eligible for the Canadian Experience Class and adds Canadian-experience CRS points.",
      monthsMin: 12,
      monthsMax: 12,
      officialLink: sources.cec.url,
    },
    {
      title: "Express Entry (CEC) — ITA, application, landing",
      detail: "Canadian experience puts you in scope for CEC draws.",
      monthsMin: processing.expressEntryAfterITA[0],
      monthsMax: processing.expressEntryAfterITA[1] + 2,
      officialLink: sources.drawRounds.url,
    },
    ...citizenshipSteps(1.5),
  ];
  const [mMin, mMax] = sumSteps(steps.slice(0, -2));
  const [cMin, cMax] = sumSteps(steps);
  const [costMin, costMax] = eeCosts(profile, false);

  return {
    id: "work-permit",
    title: "Work permit first — job offer → CEC",
    tagline: "Fastest non-Express-Entry start if you already have a Canadian employer.",
    status: "action-needed",
    rank: 2,
    steps,
    monthsToPRMin: mMin,
    monthsToPRMax: mMax,
    monthsToCitizenshipMin: cMin,
    monthsToCitizenshipMax: cMax,
    estCostMinCAD: fees.workPermit + costMin,
    estCostMaxCAD: fees.workPermit + costMax,
    requirements: [
      { met: profile.hasJobOffer, label: "A genuine job offer from a Canadian employer" },
      {
        met: profile.teer !== null && profile.teer <= 3,
        label: "The role is skilled (TEER 0–3)",
      },
    ],
    caveats: [
      "LMIA-based offers are employer-driven — this route only works with a committed employer.",
      "A job offer no longer adds CRS points (changed 2025-03-25), but the Canadian work experience it produces does.",
    ],
  };
}

/* ------------------------------- Planner ------------------------------- */

export function buildPlannerResult(profile: Profile, draws: DrawsData): PlannerResult {
  const crsBreakdown = calculateCRS(profile);
  const crs = crsBreakdown.total;
  const programs = checkAllPrograms(profile);

  const pathways: PathwayPlan[] = [];
  const ee = expressEntryPathway(profile, crs, draws);
  if (ee) pathways.push(ee);

  const eeReady = ee?.status === "ready";
  if (!eeReady) {
    pathways.push(pnpPathway(profile, crs));
    if (profile.hasJobOffer) pathways.push(workPermitPathway(profile));
    if (profile.openToStudy) pathways.push(studyPathway(profile, draws));
  } else {
    // Still show study as an informational alternative for students.
    if (profile.openToStudy && !ee) pathways.push(studyPathway(profile, draws));
  }

  // If nothing is on the board (rare), always offer the long-term routes.
  if (pathways.length === 0) {
    pathways.push(studyPathway(profile, draws), pnpPathway(profile, crs));
  }

  pathways.sort((a, b) => a.rank - b.rank || a.monthsToPRMax - b.monthsToPRMax);

  return {
    crs: crsBreakdown,
    fswGridPoints: calculateFSWGrid(profile),
    programs,
    pathways,
    boosters: computeBoosters(profile, crs),
  };
}

export { requiredFunds };
