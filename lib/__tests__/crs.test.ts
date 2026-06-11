import { describe, expect, it } from "vitest";
import { calculateCRS } from "@/lib/crs";
import { calculateFSWGrid } from "@/lib/fsw";
import { ieltsToCLB } from "@/lib/language";
import type { Profile } from "@/lib/types";

/** Baseline profile; tests override the fields they care about. */
const base: Profile = {
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
  openToStudy: false,
  citizenship: "other",
  refugeeStatus: false,
  dependentChildren: 0,
  iecEligible: "no",
};

describe("calculateCRS — hand-verified golden profiles", () => {
  it("single FSW candidate: 29, master's, CLB 9, 3 yrs foreign work = 469", () => {
    const r = calculateCRS(base);
    // Core: age 110 + edu 135 + lang 4×31 = 369
    expect(r.coreHumanCapital.age).toBe(110);
    expect(r.coreHumanCapital.education).toBe(135);
    expect(r.coreHumanCapital.firstLanguage).toBe(124);
    expect(r.coreHumanCapital.canadianWork).toBe(0);
    // Transferability: edu×lang 50 + foreign×lang 50, capped pairs = 100
    expect(r.skillTransferability.subtotal).toBe(100);
    expect(r.total).toBe(469);
  });

  it("married CEC candidate in Canada = 432", () => {
    const r = calculateCRS({
      ...base,
      age: 32,
      maritalStatus: "married",
      spouseAccompanying: true,
      spouse: {
        education: "bachelors",
        clb: { listening: 8, reading: 8, writing: 8, speaking: 8 },
        canadianWorkYears: 1,
      },
      education: "bachelors",
      firstLanguage: {
        lang: "en",
        clb: { listening: 8, reading: 8, writing: 8, speaking: 8 },
      },
      foreignWorkYears: 2,
      canadianWorkYears: 2,
    });
    // Core: age 85 + edu 112 + lang 4×22=88 + cdn work 46 = 331
    expect(r.coreHumanCapital.subtotal).toBe(331);
    // Spouse: edu 8 + lang 4×3=12 + work 5 = 25
    expect(r.spouseFactors.subtotal).toBe(25);
    // Transfer: (13+25) + (13+25) = 76
    expect(r.skillTransferability.subtotal).toBe(76);
    expect(r.total).toBe(432);
  });

  it("bilingual with sibling: French bonus 50 + sibling 15", () => {
    const r = calculateCRS({
      ...base,
      age: 24,
      education: "bachelors",
      secondLanguage: {
        lang: "fr",
        clb: { listening: 7, reading: 7, writing: 7, speaking: 7 },
      },
      foreignWorkYears: 1,
      siblingInCanada: true,
    });
    // Core: 110 + 120 + 124 + second-lang 12 = 366; transfer 25+25=50; additional 65
    expect(r.additional.french).toBe(50);
    expect(r.additional.sibling).toBe(15);
    expect(r.total).toBe(481);
  });

  it("provincial nomination adds exactly 600", () => {
    const without = calculateCRS(base).total;
    const withNom = calculateCRS(base, { withProvincialNomination: true }).total;
    expect(withNom - without).toBe(600);
  });

  it("job offers add nothing (removed 2025-03-25)", () => {
    const without = calculateCRS(base).total;
    const withOffer = calculateCRS({ ...base, hasJobOffer: true }).total;
    expect(withOffer).toBe(without);
  });
});

describe("calculateFSWGrid", () => {
  it("strong single candidate passes: 12 age + 23 edu + 24 lang + 11 exp = 70", () => {
    expect(calculateFSWGrid(base)).toBe(70);
  });
});

describe("ieltsToCLB", () => {
  it("converts 8.0/7.0/7.0/7.0 to CLB 9 across the board", () => {
    expect(
      ieltsToCLB({ listening: 8.0, reading: 7.0, writing: 7.0, speaking: 7.0 }),
    ).toEqual({ listening: 9, reading: 9, writing: 9, speaking: 9 });
  });

  it("converts straight 6.0s to CLB 7", () => {
    expect(
      ieltsToCLB({ listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0 }),
    ).toEqual({ listening: 7, reading: 7, writing: 7, speaking: 7 });
  });

  it("reading 6.5 reaches CLB 8 but listening 6.5 stays at CLB 7", () => {
    const r = ieltsToCLB({ listening: 6.5, reading: 6.5, writing: 6.5, speaking: 6.5 });
    expect(r.reading).toBe(8);
    expect(r.listening).toBe(7);
  });
});
