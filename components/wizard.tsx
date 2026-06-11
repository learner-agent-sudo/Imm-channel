"use client";

/**
 * Multi-step anonymous questionnaire. All state lives in this component;
 * nothing is transmitted anywhere — the profile is handed to the planner
 * in-memory on completion. Every label comes from the i18n dictionaries.
 */

import { useState } from "react";
import type {
  Citizenship,
  CLBScores,
  EducationLevel,
  FundsBand,
  IecEligible,
  InCanadaStatus,
  OccupationCategory,
  Profile,
} from "@/lib/types";
import { celpipToCLB, ieltsToCLB, minCLB, pteToCLB } from "@/lib/language";
import { useT } from "@/components/locale-provider";
import type { DictKey } from "@/lib/i18n";

/* ------------------------------ Form model ------------------------------ */

type EnglishTest = "ielts-general" | "celpip-general" | "pte-core" | "self-estimate" | "none";

interface FormState {
  age: string;
  maritalStatus: "single" | "married";
  spouseAccompanying: boolean;
  spouseEducation: EducationLevel;
  spouseCLB: string;
  spouseCanadianWorkYears: string;

  education: EducationLevel;
  canadianCredential: Profile["canadianCredential"];

  englishTest: EnglishTest;
  englishScores: Record<keyof CLBScores, string>;
  englishSelfCLB: string;
  frenchNCLC: string;

  foreignWorkYears: string;
  canadianWorkYears: string;
  teer: string;
  occupationCategory: OccupationCategory;
  tradesCertificate: boolean;
  hasJobOffer: boolean;

  inCanadaStatus: InCanadaStatus;
  siblingInCanada: boolean;
  fundsBand: FundsBand;
  openToStudy: boolean;
  citizenship: Citizenship;
  refugeeStatus: boolean;
  dependentChildren: string;
  iecEligible: IecEligible;
}

const initialForm: FormState = {
  age: "",
  maritalStatus: "single",
  spouseAccompanying: false,
  spouseEducation: "secondary",
  spouseCLB: "",
  spouseCanadianWorkYears: "0",
  education: "bachelors",
  canadianCredential: "none",
  englishTest: "ielts-general",
  englishScores: { listening: "", reading: "", writing: "", speaking: "" },
  englishSelfCLB: "7",
  frenchNCLC: "",
  foreignWorkYears: "0",
  canadianWorkYears: "0",
  teer: "1",
  occupationCategory: "none",
  tradesCertificate: false,
  hasJobOffer: false,
  inCanadaStatus: "outside",
  siblingInCanada: false,
  fundsBand: "16k-30k",
  openToStudy: true,
  citizenship: "other",
  refugeeStatus: false,
  dependentChildren: "0",
  iecEligible: "unsure",
};

const CITIZENSHIP_KEYS: { value: Citizenship; key: DictKey }[] = [
  { value: "other", key: "cit.other" },
  { value: "hong-kong", key: "cit.hk" },
  { value: "ukraine", key: "cit.ua" },
  { value: "afghanistan", key: "cit.af" },
  { value: "sudan", key: "cit.sudan" },
  { value: "haiti", key: "cit.haiti" },
  { value: "iran", key: "cit.iran" },
  { value: "usa", key: "cit.usa" },
  { value: "mexico", key: "cit.mexico" },
  { value: "crisis-other", key: "cit.crisis" },
];

const EDUCATION_KEYS: { value: EducationLevel; key: DictKey }[] = [
  { value: "less-than-secondary", key: "edu.none" },
  { value: "secondary", key: "edu.secondary" },
  { value: "one-year-post-secondary", key: "edu.oneYear" },
  { value: "two-year-post-secondary", key: "edu.twoYear" },
  { value: "bachelors", key: "edu.bachelors" },
  { value: "two-or-more-credentials", key: "edu.twoPlus" },
  { value: "masters-or-professional", key: "edu.masters" },
  { value: "doctoral", key: "edu.phd" },
];

const TEER_KEYS: { value: string; key: DictKey }[] = [
  { value: "0", key: "teer.0" },
  { value: "1", key: "teer.1" },
  { value: "2", key: "teer.2" },
  { value: "3", key: "teer.3" },
  { value: "4", key: "teer.4" },
  { value: "5", key: "teer.5" },
  { value: "none", key: "teer.none" },
];

const FUNDS_KEYS: { value: FundsBand; key: DictKey }[] = [
  { value: "under-10k", key: "funds.1" },
  { value: "10k-16k", key: "funds.2" },
  { value: "16k-30k", key: "funds.3" },
  { value: "30k-60k", key: "funds.4" },
  { value: "over-60k", key: "funds.5" },
];

const CLB_LEVELS = [4, 5, 6, 7, 8, 9, 10] as const;

const SCORE_HINTS: Record<Exclude<EnglishTest, "self-estimate" | "none">, string> = {
  "ielts-general": "IELTS 0–9",
  "celpip-general": "CELPIP 1–12",
  "pte-core": "PTE 10–90",
};

/* ----------------------------- Small helpers ----------------------------- */

function num(value: string, fallback = 0): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function uniformCLB(level: number): CLBScores {
  return { listening: level, reading: level, writing: level, speaking: level };
}

function englishCLB(form: FormState): CLBScores | null {
  if (form.englishTest === "none") return null;
  if (form.englishTest === "self-estimate") return uniformCLB(num(form.englishSelfCLB));
  const raw: CLBScores = {
    listening: num(form.englishScores.listening),
    reading: num(form.englishScores.reading),
    writing: num(form.englishScores.writing),
    speaking: num(form.englishScores.speaking),
  };
  if (form.englishTest === "ielts-general") return ieltsToCLB(raw);
  if (form.englishTest === "pte-core") return pteToCLB(raw);
  return celpipToCLB(raw);
}

export function toProfile(form: FormState): Profile {
  const english = englishCLB(form);
  const french = form.frenchNCLC === "" ? null : uniformCLB(num(form.frenchNCLC));

  // The candidate may pick either official language as their first; the
  // stronger one (by lowest ability) maximizes points.
  let firstLanguage: Profile["firstLanguage"] = null;
  let secondLanguage: Profile["secondLanguage"] = null;
  if (english && french) {
    if (minCLB(french) > minCLB(english)) {
      firstLanguage = { lang: "fr", clb: french };
      secondLanguage = { lang: "en", clb: english };
    } else {
      firstLanguage = { lang: "en", clb: english };
      secondLanguage = { lang: "fr", clb: french };
    }
  } else if (english) {
    firstLanguage = { lang: "en", clb: english };
  } else if (french) {
    firstLanguage = { lang: "fr", clb: french };
  }

  const married = form.maritalStatus === "married";
  return {
    age: Math.max(16, Math.min(70, Math.round(num(form.age, 30)))),
    maritalStatus: form.maritalStatus,
    spouseAccompanying: married && form.spouseAccompanying,
    spouse:
      married && form.spouseAccompanying
        ? {
            education: form.spouseEducation,
            clb: form.spouseCLB === "" ? null : uniformCLB(num(form.spouseCLB)),
            canadianWorkYears: num(form.spouseCanadianWorkYears),
          }
        : null,
    education: form.education,
    canadianCredential: form.canadianCredential,
    firstLanguage,
    secondLanguage,
    foreignWorkYears: Math.min(20, num(form.foreignWorkYears)),
    canadianWorkYears: Math.min(20, num(form.canadianWorkYears)),
    teer: form.teer === "none" ? null : (num(form.teer) as Profile["teer"]),
    occupationCategory: form.occupationCategory,
    tradesCertificate: form.tradesCertificate,
    hasJobOffer: form.hasJobOffer,
    siblingInCanada: form.siblingInCanada,
    inCanadaStatus: form.inCanadaStatus,
    fundsBand: form.fundsBand,
    openToStudy: form.openToStudy,
    citizenship: form.citizenship,
    refugeeStatus: form.refugeeStatus,
    dependentChildren: Math.max(0, Math.min(10, Math.round(num(form.dependentChildren)))),
    iecEligible: form.iecEligible,
  };
}

/* ------------------------------- UI atoms ------------------------------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-soft">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-maple focus:outline-none focus:ring-2 focus:ring-maple/20";

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-maple"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-soft">{hint}</span>}
      </span>
    </label>
  );
}

/* -------------------------------- Wizard -------------------------------- */

const STEP_KEYS: DictKey[] = [
  "wiz.step.about",
  "wiz.step.education",
  "wiz.step.language",
  "wiz.step.work",
  "wiz.step.situation",
];

const ABILITIES = ["listening", "reading", "writing", "speaking"] as const;
const ABILITY_KEYS: Record<(typeof ABILITIES)[number], DictKey> = {
  listening: "ability.listening",
  reading: "ability.reading",
  writing: "ability.writing",
  speaking: "ability.speaking",
};

export default function Wizard({ onComplete }: { onComplete: (p: Profile) => void }) {
  const { t } = useT();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function validate(): string | null {
    if (step === 0) {
      const age = num(form.age, -1);
      if (age < 16 || age > 70) return t("wiz.err.age");
    }
    if (step === 2) {
      if (form.englishTest !== "none" && form.englishTest !== "self-estimate") {
        const vals = Object.values(form.englishScores);
        if (vals.some((v) => v.trim() === "")) return t("wiz.err.scores");
      }
      if (form.englishTest === "none" && form.frenchNCLC === "") return t("wiz.err.lang");
    }
    return null;
  }

  function next() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    if (step < STEP_KEYS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(toProfile(form));
    }
  }

  const eduOptions = EDUCATION_KEYS.map((o) => (
    <option key={o.value} value={o.value}>
      {t(o.key)}
    </option>
  ));

  const clbOptions = CLB_LEVELS.map((lvl) => (
    <option key={lvl} value={lvl}>
      CLB {lvl} — {t(`clb.${lvl}` as DictKey)}
    </option>
  ));

  return (
    <div>
      {/* Progress */}
      <ol className="mb-8 flex items-center gap-1 text-xs font-medium text-soft">
        {STEP_KEYS.map((key, i) => (
          <li key={key} className="flex flex-1 flex-col gap-1.5">
            <span
              className={`h-1.5 rounded-full ${i <= step ? "bg-maple" : "bg-slate-200"}`}
            />
            <span className={i === step ? "text-ink" : ""}>{t(key)}</span>
          </li>
        ))}
      </ol>

      <div className="space-y-5">
        {step === 0 && (
          <>
            <Field label={t("wiz.age")}>
              <input
                type="number"
                min={16}
                max={70}
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                className={inputCls}
                placeholder={t("wiz.age.ph")}
              />
            </Field>
            <Field label={t("wiz.marital")}>
              <select
                value={form.maritalStatus}
                onChange={(e) => set("maritalStatus", e.target.value as FormState["maritalStatus"])}
                className={inputCls}
              >
                <option value="single">{t("wiz.marital.single")}</option>
                <option value="married">{t("wiz.marital.married")}</option>
              </select>
            </Field>
            {form.maritalStatus === "married" && (
              <Toggle
                checked={form.spouseAccompanying}
                onChange={(v) => set("spouseAccompanying", v)}
                label={t("wiz.spouseComing")}
                hint={t("wiz.spouseComing.hint")}
              />
            )}
            {form.maritalStatus === "married" && form.spouseAccompanying && (
              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Field label={t("wiz.spouse.edu")}>
                  <select
                    value={form.spouseEducation}
                    onChange={(e) => set("spouseEducation", e.target.value as EducationLevel)}
                    className={inputCls}
                  >
                    {eduOptions}
                  </select>
                </Field>
                <Field label={t("wiz.spouse.lang")} hint={t("wiz.spouse.lang.hint")}>
                  <select
                    value={form.spouseCLB}
                    onChange={(e) => set("spouseCLB", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">{t("wiz.spouse.lang.none")}</option>
                    {clbOptions}
                  </select>
                </Field>
                <Field label={t("wiz.spouse.work")}>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={form.spouseCanadianWorkYears}
                    onChange={(e) => set("spouseCanadianWorkYears", e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            )}
            <Field label={t("wiz.children")} hint={t("wiz.children.hint")}>
              <input
                type="number"
                min={0}
                max={10}
                value={form.dependentChildren}
                onChange={(e) => set("dependentChildren", e.target.value)}
                className={inputCls}
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label={t("wiz.edu")} hint={t("wiz.edu.hint")}>
              <select
                value={form.education}
                onChange={(e) => set("education", e.target.value as EducationLevel)}
                className={inputCls}
              >
                {eduOptions}
              </select>
            </Field>
            <Field label={t("wiz.cdnCred")} hint={t("wiz.cdnCred.hint")}>
              <select
                value={form.canadianCredential}
                onChange={(e) =>
                  set("canadianCredential", e.target.value as FormState["canadianCredential"])
                }
                className={inputCls}
              >
                <option value="none">{t("cdnCred.none")}</option>
                <option value="one-or-two-year">{t("cdnCred.short")}</option>
                <option value="three-plus-year">{t("cdnCred.long")}</option>
              </select>
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label={t("wiz.english")} hint={t("wiz.english.hint")}>
              <select
                value={form.englishTest}
                onChange={(e) => set("englishTest", e.target.value as EnglishTest)}
                className={inputCls}
              >
                <option value="ielts-general">{t("eng.ielts")}</option>
                <option value="celpip-general">{t("eng.celpip")}</option>
                <option value="pte-core">{t("eng.pte")}</option>
                <option value="self-estimate">{t("eng.self")}</option>
                <option value="none">{t("eng.none")}</option>
              </select>
            </Field>

            {form.englishTest !== "none" && form.englishTest !== "self-estimate" && (
              <div className="grid grid-cols-2 gap-4">
                {ABILITIES.map((ability) => (
                  <Field key={ability} label={t(ABILITY_KEYS[ability])}>
                    <input
                      type="number"
                      step="0.5"
                      value={form.englishScores[ability]}
                      onChange={(e) =>
                        set("englishScores", { ...form.englishScores, [ability]: e.target.value })
                      }
                      className={inputCls}
                      placeholder={SCORE_HINTS[form.englishTest as keyof typeof SCORE_HINTS]}
                    />
                  </Field>
                ))}
              </div>
            )}

            {form.englishTest === "self-estimate" && (
              <Field label={t("wiz.engSelf")}>
                <select
                  value={form.englishSelfCLB}
                  onChange={(e) => set("englishSelfCLB", e.target.value)}
                  className={inputCls}
                >
                  {clbOptions}
                </select>
              </Field>
            )}

            <Field label={t("wiz.french")} hint={t("wiz.french.hint")}>
              <select
                value={form.frenchNCLC}
                onChange={(e) => set("frenchNCLC", e.target.value)}
                className={inputCls}
              >
                <option value="">{t("wiz.french.none")}</option>
                {CLB_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    NCLC {lvl}
                    {lvl >= 7 ? ` ${t("wiz.french.unlock")}` : ""}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label={t("wiz.teer")}>
              <select
                value={form.teer}
                onChange={(e) => set("teer", e.target.value)}
                className={inputCls}
              >
                {TEER_KEYS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.key)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("wiz.foreignYears")}>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={form.foreignWorkYears}
                  onChange={(e) => set("foreignWorkYears", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label={t("wiz.cdnYears")}>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={form.canadianWorkYears}
                  onChange={(e) => set("canadianWorkYears", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label={t("wiz.cat")} hint={t("wiz.cat.hint")}>
              <select
                value={form.occupationCategory}
                onChange={(e) => set("occupationCategory", e.target.value as OccupationCategory)}
                className={inputCls}
              >
                <option value="none">{t("cat.none")}</option>
                <option value="healthcare">{t("cat.healthcare")}</option>
                <option value="stem">{t("cat.stem")}</option>
                <option value="trades">{t("cat.trades")}</option>
                <option value="education">{t("cat.education")}</option>
                <option value="agriculture">{t("cat.agriculture")}</option>
              </select>
            </Field>
            <Toggle
              checked={form.tradesCertificate}
              onChange={(v) => set("tradesCertificate", v)}
              label={t("wiz.tradeCert")}
            />
            <Toggle
              checked={form.hasJobOffer}
              onChange={(v) => set("hasJobOffer", v)}
              label={t("wiz.jobOffer")}
              hint={t("wiz.jobOffer.hint")}
            />
          </>
        )}

        {step === 4 && (
          <>
            <Field label={t("wiz.where")}>
              <select
                value={form.inCanadaStatus}
                onChange={(e) => set("inCanadaStatus", e.target.value as InCanadaStatus)}
                className={inputCls}
              >
                <option value="outside">{t("where.outside")}</option>
                <option value="visitor">{t("where.visitor")}</option>
                <option value="student">{t("where.student")}</option>
                <option value="worker">{t("where.worker")}</option>
              </select>
            </Field>
            <Field label={t("wiz.citizenship")} hint={t("wiz.citizenship.hint")}>
              <select
                value={form.citizenship}
                onChange={(e) => set("citizenship", e.target.value as Citizenship)}
                className={inputCls}
              >
                {CITIZENSHIP_KEYS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.key)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("wiz.iec")} hint={t("wiz.iec.hint")}>
              <select
                value={form.iecEligible}
                onChange={(e) => set("iecEligible", e.target.value as IecEligible)}
                className={inputCls}
              >
                <option value="unsure">{t("iec.unsure")}</option>
                <option value="yes">{t("iec.yes")}</option>
                <option value="no">{t("iec.no")}</option>
              </select>
            </Field>
            <Field label={t("wiz.funds")} hint={t("wiz.funds.hint")}>
              <select
                value={form.fundsBand}
                onChange={(e) => set("fundsBand", e.target.value as FundsBand)}
                className={inputCls}
              >
                {FUNDS_KEYS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.key)}
                  </option>
                ))}
              </select>
            </Field>
            <Toggle
              checked={form.siblingInCanada}
              onChange={(v) => set("siblingInCanada", v)}
              label={t("wiz.sibling")}
              hint={t("wiz.sibling.hint")}
            />
            <Toggle
              checked={form.refugeeStatus}
              onChange={(v) => set("refugeeStatus", v)}
              label={t("wiz.refugee")}
              hint={t("wiz.refugee.hint")}
            />
            <Toggle
              checked={form.openToStudy}
              onChange={(v) => set("openToStudy", v)}
              label={t("wiz.study")}
            />
          </>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-maple">{error}</p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          {t("wiz.back")}
        </button>
        <button
          type="button"
          onClick={next}
          className="rounded-lg bg-maple px-6 py-2.5 text-sm font-semibold text-white hover:bg-maple-dark"
        >
          {step === STEP_KEYS.length - 1 ? t("wiz.submit") : t("wiz.continue")}
        </button>
      </div>
    </div>
  );
}
