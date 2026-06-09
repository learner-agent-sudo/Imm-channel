"use client";

/**
 * Multi-step anonymous questionnaire. All state lives in this component;
 * nothing is transmitted anywhere — the profile is handed to the planner
 * in-memory on completion.
 */

import { useState } from "react";
import type {
  CLBScores,
  EducationLevel,
  FundsBand,
  InCanadaStatus,
  OccupationCategory,
  Profile,
} from "@/lib/types";
import { celpipToCLB, clbSelfEstimateOptions, ieltsToCLB, minCLB, pteToCLB } from "@/lib/language";

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
};

const EDUCATION_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: "less-than-secondary", label: "Below high school" },
  { value: "secondary", label: "High school diploma" },
  { value: "one-year-post-secondary", label: "1-year post-secondary certificate" },
  { value: "two-year-post-secondary", label: "2-year diploma" },
  { value: "bachelors", label: "Bachelor's degree (3+ year credential)" },
  { value: "two-or-more-credentials", label: "Two or more credentials (one 3+ years)" },
  { value: "masters-or-professional", label: "Master's or professional degree (MD, JD…)" },
  { value: "doctoral", label: "Doctorate (PhD)" },
];

const TEER_OPTIONS = [
  { value: "0", label: "TEER 0 — management (e.g. engineering or restaurant manager)" },
  { value: "1", label: "TEER 1 — degree-level professional (software engineer, nurse, accountant)" },
  { value: "2", label: "TEER 2 — college diploma / supervisor / skilled trade (electrician, technician)" },
  { value: "3", label: "TEER 3 — shorter college or apprenticeship (baker, dental assistant)" },
  { value: "4", label: "TEER 4 — high-school level (admin clerk, home support worker)" },
  { value: "5", label: "TEER 5 — short-term demonstration (cleaner, labourer, courier)" },
  { value: "none", label: "No paid work experience yet" },
];

const FUNDS_OPTIONS: { value: FundsBand; label: string }[] = [
  { value: "under-10k", label: "Under $10,000 CAD" },
  { value: "10k-16k", label: "$10,000 – $16,000 CAD" },
  { value: "16k-30k", label: "$16,000 – $30,000 CAD" },
  { value: "30k-60k", label: "$30,000 – $60,000 CAD" },
  { value: "over-60k", label: "Over $60,000 CAD" },
];

const SCORE_HINTS: Record<Exclude<EnglishTest, "self-estimate" | "none">, string> = {
  "ielts-general": "IELTS General Training band scores, e.g. 6.5",
  "celpip-general": "CELPIP-General levels 1–12",
  "pte-core": "PTE Core scores 10–90",
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

const STEP_TITLES = ["About you", "Education", "Language", "Work", "Your situation"];

export default function Wizard({ onComplete }: { onComplete: (p: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function validate(): string | null {
    if (step === 0) {
      const age = num(form.age, -1);
      if (age < 16 || age > 70) return "Please enter an age between 16 and 70.";
    }
    if (step === 2) {
      if (form.englishTest !== "none" && form.englishTest !== "self-estimate") {
        const vals = Object.values(form.englishScores);
        if (vals.some((v) => v.trim() === "")) {
          return "Enter all four test scores, or switch to “Estimate my level”.";
        }
      }
      if (form.englishTest === "none" && form.frenchNCLC === "") {
        return "Economic immigration requires an official language. Pick a test or an estimate for English or French.";
      }
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
    if (step < STEP_TITLES.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(toProfile(form));
    }
  }

  return (
    <div>
      {/* Progress */}
      <ol className="mb-8 flex items-center gap-1 text-xs font-medium text-soft">
        {STEP_TITLES.map((title, i) => (
          <li key={title} className="flex flex-1 flex-col gap-1.5">
            <span
              className={`h-1.5 rounded-full ${i <= step ? "bg-maple" : "bg-slate-200"}`}
            />
            <span className={i === step ? "text-ink" : ""}>{title}</span>
          </li>
        ))}
      </ol>

      <div className="space-y-5">
        {step === 0 && (
          <>
            <Field label="How old are you?">
              <input
                type="number"
                min={16}
                max={70}
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                className={inputCls}
                placeholder="e.g. 29"
              />
            </Field>
            <Field label="Marital status">
              <select
                value={form.maritalStatus}
                onChange={(e) => set("maritalStatus", e.target.value as FormState["maritalStatus"])}
                className={inputCls}
              >
                <option value="single">Single / divorced / widowed</option>
                <option value="married">Married or common-law</option>
              </select>
            </Field>
            {form.maritalStatus === "married" && (
              <Toggle
                checked={form.spouseAccompanying}
                onChange={(v) => set("spouseAccompanying", v)}
                label="My spouse/partner would immigrate with me"
                hint="If your partner is already a Canadian citizen or PR, leave this off — you're scored as single."
              />
            )}
            {form.maritalStatus === "married" && form.spouseAccompanying && (
              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Field label="Spouse's highest education">
                  <select
                    value={form.spouseEducation}
                    onChange={(e) => set("spouseEducation", e.target.value as EducationLevel)}
                    className={inputCls}
                  >
                    {EDUCATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Spouse's English/French level (CLB)"
                  hint="Leave blank if untested — spouse language only counts with an official test."
                >
                  <select
                    value={form.spouseCLB}
                    onChange={(e) => set("spouseCLB", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Not tested / unknown</option>
                    {clbSelfEstimateOptions.map((o) => (
                      <option key={o.clb} value={o.clb}>
                        CLB {o.clb} — {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Spouse's years of skilled work in Canada">
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
          </>
        )}

        {step === 1 && (
          <>
            <Field
              label="Your highest completed education"
              hint="Foreign credentials are fine — they'll need an Educational Credential Assessment (ECA) later."
            >
              <select
                value={form.education}
                onChange={(e) => set("education", e.target.value as EducationLevel)}
                className={inputCls}
              >
                {EDUCATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Did you complete any of that education in Canada?"
              hint="Canadian credentials earn bonus points. A Canadian master's or PhD counts in the 3+ year tier."
            >
              <select
                value={form.canadianCredential}
                onChange={(e) =>
                  set("canadianCredential", e.target.value as FormState["canadianCredential"])
                }
                className={inputCls}
              >
                <option value="none">No</option>
                <option value="one-or-two-year">Yes — 1 or 2 year credential</option>
                <option value="three-plus-year">Yes — 3+ years, master&apos;s or PhD</option>
              </select>
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="English ability" hint="Pick the test you've taken, or estimate honestly.">
              <select
                value={form.englishTest}
                onChange={(e) => set("englishTest", e.target.value as EnglishTest)}
                className={inputCls}
              >
                <option value="ielts-general">I have IELTS General Training scores</option>
                <option value="celpip-general">I have CELPIP-General scores</option>
                <option value="pte-core">I have PTE Core scores</option>
                <option value="self-estimate">Estimate my level (no test yet)</option>
                <option value="none">No English</option>
              </select>
            </Field>

            {form.englishTest !== "none" && form.englishTest !== "self-estimate" && (
              <div className="grid grid-cols-2 gap-4">
                {(["listening", "reading", "writing", "speaking"] as const).map((ability) => (
                  <Field key={ability} label={ability[0].toUpperCase() + ability.slice(1)}>
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
              <Field label="Estimated English level">
                <select
                  value={form.englishSelfCLB}
                  onChange={(e) => set("englishSelfCLB", e.target.value)}
                  className={inputCls}
                >
                  {clbSelfEstimateOptions.map((o) => (
                    <option key={o.clb} value={o.clb}>
                      CLB {o.clb} — {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field
              label="French ability (NCLC)"
              hint="TEF/TCF Canada reports show your NCLC level. French at NCLC 7+ unlocks bonus points and French-category draws."
            >
              <select
                value={form.frenchNCLC}
                onChange={(e) => set("frenchNCLC", e.target.value)}
                className={inputCls}
              >
                <option value="">No French / below NCLC 4</option>
                {[4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    NCLC {lvl}
                    {lvl >= 7 ? " — unlocks French bonus" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="What kind of work do you mainly do?">
              <select
                value={form.teer}
                onChange={(e) => set("teer", e.target.value)}
                className={inputCls}
              >
                {TEER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Years of skilled work outside Canada">
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={form.foreignWorkYears}
                  onChange={(e) => set("foreignWorkYears", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Years of skilled work inside Canada">
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
            <Field
              label="Is your occupation in one of these in-demand groups?"
              hint="IRCC runs special draws with lower cutoffs for these categories."
            >
              <select
                value={form.occupationCategory}
                onChange={(e) => set("occupationCategory", e.target.value as OccupationCategory)}
                className={inputCls}
              >
                <option value="none">None of these / not sure</option>
                <option value="healthcare">Healthcare & social services</option>
                <option value="stem">STEM (science, tech, engineering, math)</option>
                <option value="trades">Skilled trades (construction, mechanics…)</option>
                <option value="education">Education (teachers, ECEs)</option>
                <option value="agriculture">Agriculture & agri-food</option>
              </select>
            </Field>
            <Toggle
              checked={form.tradesCertificate}
              onChange={(v) => set("tradesCertificate", v)}
              label="I hold a Canadian provincial trade certificate of qualification"
            />
            <Toggle
              checked={form.hasJobOffer}
              onChange={(v) => set("hasJobOffer", v)}
              label="I have (or expect) a job offer from a Canadian employer"
              hint="No longer worth CRS points, but it opens the work-permit-first route."
            />
          </>
        )}

        {step === 4 && (
          <>
            <Field label="Where are you right now?">
              <select
                value={form.inCanadaStatus}
                onChange={(e) => set("inCanadaStatus", e.target.value as InCanadaStatus)}
                className={inputCls}
              >
                <option value="outside">Outside Canada</option>
                <option value="visitor">In Canada as a visitor</option>
                <option value="student">In Canada on a study permit</option>
                <option value="worker">In Canada on a work permit</option>
              </select>
            </Field>
            <Field
              label="Settlement funds available"
              hint="Unencumbered savings you could show IRCC. Express Entry (FSW/FST) and study permits have minimum amounts."
            >
              <select
                value={form.fundsBand}
                onChange={(e) => set("fundsBand", e.target.value as FundsBand)}
                className={inputCls}
              >
                {FUNDS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Toggle
              checked={form.siblingInCanada}
              onChange={(v) => set("siblingInCanada", v)}
              label="I have a sibling (18+) who is a Canadian citizen or PR"
              hint="Worth 15 CRS points."
            />
            <Toggle
              checked={form.openToStudy}
              onChange={(v) => set("openToStudy", v)}
              label="I'd consider studying in Canada if it's the best route"
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
          ← Back
        </button>
        <button
          type="button"
          onClick={next}
          className="rounded-lg bg-maple px-6 py-2.5 text-sm font-semibold text-white hover:bg-maple-dark"
        >
          {step === STEP_TITLES.length - 1 ? "Build my roadmap" : "Continue →"}
        </button>
      </div>
    </div>
  );
}
