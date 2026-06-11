import type { Metadata } from "next";
import Link from "next/link";
import { sources, studyCostOfLiving, fees, thirdPartyCosts } from "@/lib/rules/parameters";

export const metadata: Metadata = {
  title: "Study permit, step by step — Imm Channel",
  description:
    "How to choose a PGWP-safe program, get the PAL and LOA, prove funds, and avoid the common refusal reasons — with timelines per intake.",
};

const checklist = [
  "Letter of acceptance (LOA) from a designated learning institution (DLI)",
  "Provincial Attestation Letter (PAL) — your institution usually requests it for you",
  "Proof of funds: first-year tuition + cost-of-living amount + travel",
  "Valid passport (covering your whole intended stay if possible)",
  "Statement of purpose / study plan letter",
  "Academic transcripts and certificates (with certified translations)",
  "Language test results if your school or visa office asks for them",
  "Medical exam (depending on country of residence) and biometrics",
  "Custodian declaration only if under 18",
];

const refusalReasons = [
  {
    title: "Financial insufficiency",
    detail:
      "The single most common refusal. Show stable, traceable funds — a GIC (Guaranteed Investment Certificate) from a Canadian bank is the cleanest evidence; large unexplained recent deposits are a red flag.",
  },
  {
    title: "Purpose of visit / ties to home country",
    detail:
      "The officer must believe you'll leave if required. A focused study plan that explains why THIS program, why Canada, and how it fits your career back home matters more than people expect — even though most students do intend to stay via PGWP, the permit is assessed as a temporary visa.",
  },
  {
    title: "Program–career mismatch",
    detail:
      "A 35-year-old manager applying for a 1-year hospitality certificate raises questions. If you're changing fields or studying 'below' your existing credential, address it head-on in the study plan.",
  },
  {
    title: "Incomplete or inconsistent documents",
    detail:
      "Dates that don't line up, missing translations, or an expired language test. Triple-check before submitting — a refusal stays on your record and must be declared in future applications.",
  },
];

const steps = [
  {
    title: "Choose the program for the exit, not the entrance",
    body: "If your goal is PR, the program must lead to a post-graduation work permit (PGWP). University degrees (bachelor's, master's, PhD) are PGWP-safe. College diplomas must be in a field of study linked to long-term shortage occupations — check the current eligible-fields list BEFORE paying any deposit. Master's programs of 8+ months earn a full 3-year PGWP; college programs need 2 years for the 3-year permit. Also mind language: PGWP requires CLB 7 (university) or CLB 5 (college).",
    link: sources.pgwp,
  },
  {
    title: "Get the letter of acceptance (LOA)",
    body: "Apply to 2–3 designated learning institutions (DLIs). Application fees run $100–$250 each. Aim to hold an LOA at least 4–6 months before your intended intake (September intakes: apply by January–March; January intakes: by August–September).",
    link: sources.studyPermit,
  },
  {
    title: "Provincial Attestation Letter (PAL)",
    body: "Since 2024 most applicants need a PAL proving you fit within the province's study-permit allocation. Your school requests it after you accept the offer and (usually) pay a deposit. Master's/PhD students and some categories are exempt. Budget 2–6 weeks.",
    link: sources.studyPermit,
  },
  {
    title: "Assemble proof of funds",
    body: `You must show first-year tuition (have receipts for anything prepaid) plus $${studyCostOfLiving.toLocaleString()} cost of living (single applicant outside Quebec) plus travel costs. Practical evidence: a Canadian GIC of $${studyCostOfLiving.toLocaleString()}, 4–6 months of bank statements, sponsor letters with the sponsor's own proof. Funds must look stable — not parked yesterday.`,
    link: sources.studyFunds,
  },
  {
    title: "Apply online and complete biometrics",
    body: `The permit fee is $${fees.studyPermit} plus $${fees.biometricsPerPerson} biometrics. After submitting you'll get a biometrics instruction letter — book promptly, the 30-day window is real. Medical exams are required for some countries or if you'll work in healthcare/childcare.`,
    link: sources.studyPermit,
  },
  {
    title: "Wait out processing — and plan the contingency",
    body: "Processing varies hugely by country (a few weeks to several months) — check the live processing-times tool for your country. If your start date slips, schools can usually defer you one intake. Don't book non-refundable travel until approval.",
    link: sources.processingTimes,
  },
  {
    title: "After arrival: protect your PR runway",
    body: "Stay full-time enrolled — dropping to part-time can void your PGWP eligibility. You can usually work up to 24 hours/week off campus. Keep every enrolment letter and transcript; you'll need them for the PGWP application within 180 days of your final marks.",
    link: sources.pgwp,
  },
];

export default function StudyPermitGuide() {
  const tuition = thirdPartyCosts.collegeTuitionPerYear;
  const uniTuition = thirdPartyCosts.universityTuitionPerYear;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-maple">Guide</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">
        The study permit, step by step
      </h1>
      <p className="mt-3 text-soft">
        For most people who don&apos;t qualify for Express Entry today, studying in
        Canada is the on-ramp: study permit → PGWP → Canadian work experience →
        PR (and for Hong Kong passport holders, straight to Stream A after
        graduation). This guide covers the permit itself — the part where most
        plans fail. <span className="text-xs">(English only for now.)</span>
      </p>

      <div className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-soft">Typical timeline</p>
          <p className="mt-0.5 font-semibold">6–12 months before classes start</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-soft">Funds to show</p>
          <p className="mt-0.5 font-semibold">
            ${studyCostOfLiving.toLocaleString()} + first-year tuition
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-soft">Tuition reality</p>
          <p className="mt-0.5 font-semibold">
            ${tuition[0].toLocaleString()}–${uniTuition[1].toLocaleString()}/yr international
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold">The seven steps</h2>
        <ol className="mt-4 space-y-0">
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 pb-7 last:pb-0">
              {i < steps.length - 1 && (
                <span className="absolute left-[11px] top-7 h-full w-px bg-slate-200" />
              )}
              <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-soft">{s.body}</p>
                <a
                  href={s.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-medium text-maple underline underline-offset-2"
                >
                  {s.link.label} ↗
                </a>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Document checklist</h2>
        <ul className="mt-4 space-y-2">
          {checklist.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <span className="text-maple">☐</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Why study permits get refused</h2>
        <p className="mt-1 text-sm text-soft">
          Refusal rates vary enormously by country and program type. The four
          patterns below cover most refusals — write your application to
          pre-empt them.
        </p>
        <div className="mt-4 space-y-4">
          {refusalReasons.map((r) => (
            <div key={r.title} className="rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold">{r.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-soft">{r.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
        Study-permit rules changed repeatedly in 2024–2025 (caps, PALs, fund
        amounts, PGWP fields). Verify every number on the linked IRCC pages
        before acting, and check our{" "}
        <Link href="/updates" className="font-semibold underline underline-offset-2">
          policy updates
        </Link>{" "}
        page for anything new.
      </section>

      <p className="mt-8">
        <Link href="/plan" className="font-semibold text-maple underline underline-offset-2">
          ← Back to your roadmap
        </Link>
      </p>
    </div>
  );
}
