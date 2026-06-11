import { describe, expect, it } from "vitest";
import { buildSpecialPrograms } from "@/lib/special-programs";
import { buildPlannerResult } from "@/lib/roadmap";
import { getSnapshotDraws } from "@/lib/draws";
import type { Profile } from "@/lib/types";

const base: Profile = {
  age: 30,
  maritalStatus: "single",
  spouseAccompanying: false,
  spouse: null,
  education: "bachelors",
  canadianCredential: "none",
  firstLanguage: {
    lang: "en",
    clb: { listening: 6, reading: 6, writing: 6, speaking: 6 },
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
  fundsBand: "30k-60k",
  openToStudy: true,
  citizenship: "other",
  refugeeStatus: false,
};

describe("buildSpecialPrograms — Hong Kong pathway", () => {
  it("in-Canada HK worker with 1+ year of work qualifies for Stream B now", () => {
    const r = buildSpecialPrograms({
      ...base,
      citizenship: "hong-kong",
      inCanadaStatus: "worker",
      canadianWorkYears: 1,
    });
    const b = r.pathways.find((p) => p.id === "hk-stream-b");
    expect(b).toBeDefined();
    expect(b!.status).toBe("ready");
    expect(b!.requirements.every((req) => req.met)).toBe(true);
  });

  it("CLB 5 is enough for Stream B even when Express Entry is hopeless", () => {
    // CLB 6 fails FSW's CLB 7 floor, but passes the HK pathway's CLB 5.
    const result = buildPlannerResult(
      { ...base, citizenship: "hong-kong", inCanadaStatus: "worker", canadianWorkYears: 1 },
      getSnapshotDraws(),
    );
    expect(result.pathways[0].id).toBe("hk-stream-b");
    expect(result.programs.find((p) => p.programId === "fsw")!.eligible).toBe(false);
  });

  it("HK national outside Canada gets the Stream A study route and the OWP-closed notice", () => {
    const r = buildSpecialPrograms({ ...base, citizenship: "hong-kong" });
    expect(r.pathways.some((p) => p.id === "hk-stream-a")).toBe(true);
    expect(r.pathways.some((p) => p.id.startsWith("hk-stream-b"))).toBe(false);
    expect(r.notices.some((n) => n.id === "hk-owp")).toBe(true);
  });

  it("HK student in Canada without a work year is steered toward Stream B", () => {
    const r = buildSpecialPrograms({
      ...base,
      citizenship: "hong-kong",
      inCanadaStatus: "student",
    });
    expect(r.pathways.some((p) => p.id === "hk-stream-b-build")).toBe(true);
  });

  it("the HK study pathway replaces the generic study pathway in results", () => {
    const result = buildPlannerResult({ ...base, citizenship: "hong-kong" }, getSnapshotDraws());
    expect(result.pathways.some((p) => p.id === "hk-stream-a")).toBe(true);
    expect(result.pathways.some((p) => p.id === "study")).toBe(false);
  });
});

describe("buildSpecialPrograms — notices", () => {
  it("Ukrainian nationals see the CUAET status notice", () => {
    const r = buildSpecialPrograms({ ...base, citizenship: "ukraine" });
    expect(r.notices.some((n) => n.id === "cuaet")).toBe(true);
    expect(r.pathways).toHaveLength(0);
  });

  it("refugee status surfaces the EMPP notice regardless of citizenship", () => {
    const r = buildSpecialPrograms({ ...base, refugeeStatus: true });
    expect(r.notices.some((n) => n.id === "empp")).toBe(true);
  });

  it("default profile gets no special pathways or notices", () => {
    const r = buildSpecialPrograms(base);
    expect(r.pathways).toHaveLength(0);
    expect(r.notices).toHaveLength(0);
  });
});
