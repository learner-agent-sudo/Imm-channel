import { describe, expect, it } from "vitest";
import { buildPlannerResult } from "@/lib/roadmap";
import { getSnapshotDraws } from "@/lib/draws";
import type { Profile } from "@/lib/types";

const draws = getSnapshotDraws();

const fswCandidate: Profile = {
  age: 29,
  maritalStatus: "single",
  spouseAccompanying: false,
  spouse: null,
  education: "masters-or-professional",
  canadianCredential: "none",
  firstLanguage: {
    lang: "en",
    clb: { listening: 9, reading: 9, writing: 9, speaking: 9 },
  },
  secondLanguage: null,
  foreignWorkYears: 3,
  canadianWorkYears: 0,
  teer: 1,
  occupationCategory: "none",
  tradesCertificate: false,
  hasJobOffer: false,
  siblingInCanada: false,
  inCanadaStatus: "outside",
  fundsBand: "16k-30k",
  openToStudy: true,
};

describe("buildPlannerResult", () => {
  it("FSW-eligible foreign candidate gets EE + PNP + study pathways", () => {
    const r = buildPlannerResult(fswCandidate, draws);
    const ids = r.pathways.map((p) => p.id);
    expect(ids).toContain("express-entry");
    expect(ids).toContain("pnp");
    expect(ids).toContain("study");
    // 469 is below every snapshot cutoff stream available to this profile.
    expect(r.pathways.find((p) => p.id === "express-entry")!.status).toBe("action-needed");
  });

  it("citizenship always takes longer than PR, costs are positive", () => {
    const r = buildPlannerResult(fswCandidate, draws);
    for (const p of r.pathways) {
      expect(p.monthsToCitizenshipMin).toBeGreaterThan(p.monthsToPRMin);
      expect(p.monthsToCitizenshipMax).toBeGreaterThan(p.monthsToPRMax);
      expect(p.estCostMinCAD).toBeGreaterThan(0);
      expect(p.estCostMaxCAD).toBeGreaterThanOrEqual(p.estCostMinCAD);
      expect(p.steps.length).toBeGreaterThan(2);
    }
  });

  it("CEC-eligible in-Canada worker is compared against the CEC cutoff", () => {
    const r = buildPlannerResult(
      {
        ...fswCandidate,
        age: 28,
        education: "bachelors",
        canadianWorkYears: 2,
        foreignWorkYears: 0,
        canadianCredential: "one-or-two-year",
        inCanadaStatus: "worker",
      },
      draws,
    );
    const ee = r.pathways.find((p) => p.id === "express-entry");
    expect(ee).toBeDefined();
    expect(ee!.drawComparison!.some((d) => d.stream.includes("Canadian Experience"))).toBe(true);
  });

  it("strong French profile is competitive in the French stream", () => {
    const r = buildPlannerResult(
      {
        ...fswCandidate,
        secondLanguage: {
          lang: "fr",
          clb: { listening: 8, reading: 8, writing: 8, speaking: 8 },
        },
      },
      draws,
    );
    const ee = r.pathways.find((p) => p.id === "express-entry")!;
    const french = ee.drawComparison!.find((d) => d.stream.includes("French"));
    // 469 + 12 (second language) + 50 (French bonus) = 531 vs cutoff 440.
    expect(french).toBeDefined();
    expect(french!.competitive).toBe("above");
    expect(ee.status).toBe("ready");
  });

  it("study pathway projects a future CRS and uses the half-credit citizenship shortcut", () => {
    const r = buildPlannerResult(fswCandidate, draws);
    const study = r.pathways.find((p) => p.id === "study")!;
    expect(study.projectedCrs).toBeGreaterThan(450);
    const presence = study.steps.find((s) => s.title.includes("permanent resident"))!;
    expect(presence.monthsMin).toBeLessThan(36); // pre-PR time credited
  });

  it("boosters are sorted by impact and PNP (+600) is always offered", () => {
    const r = buildPlannerResult(fswCandidate, draws);
    const deltas = r.boosters.map((b) => b.delta);
    expect([...deltas].sort((a, b) => b - a)).toEqual(deltas);
    expect(r.boosters.some((b) => b.delta === 600)).toBe(true);
  });
});
