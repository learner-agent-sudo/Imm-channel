import type { Metadata } from "next";
import Link from "next/link";
import { fees, sources } from "@/lib/rules/parameters";

export const metadata: Metadata = {
  title: "Express Entry profile, step by step — Imm Channel",
  description:
    "ECA, language tests, creating the profile, what happens after an ITA, and the mistakes that get applications refused after the 60-day clock starts.",
};

const steps = [
  {
    title: "Book the language test first — it's the long pole",
    body: "IELTS General Training, CELPIP-General or PTE Core for English; TEF/TCF Canada for French. Seats in busy cities book out 4–8 weeks ahead, results take 2 weeks (CELPIP/PTE) to 2 weeks+ (IELTS). Results are valid 2 years and must be valid on the day you're invited AND the day you submit. If you're within 30 points of a cutoff, budget for a retake — language is the cheapest big point gain.",
    link: sources.languageEquivalency,
  },
  {
    title: "Start the ECA in parallel (foreign education only)",
    body: "WES is fastest for most countries (~$260, a few weeks once documents arrive); IQAS, ICES, CES and others are also designated. Your university must usually send transcripts directly — that's the slow part. The ECA is valid 5 years. Skip this entirely if your only credential is Canadian, or if you're applying under CEC with no education points needed... but note education still earns CRS points, so assess it anyway.",
    link: sources.fsw,
  },
  {
    title: "Create the profile — accuracy beats speed",
    body: "The profile itself is free and takes an hour if your documents are ready. Every claim you make (work history dates, NOC/TEER code, scores) must later be PROVEN. Choosing the right NOC code matters most: read the lead statement and duties of the code, not just the title — a mismatch between your reference letters and the code's duties is a top refusal reason.",
    link: sources.drawRounds,
  },
  {
    title: "While in the pool: keep improving, keep valid",
    body: "Your profile lasts 12 months; you can update it anytime (new test scores, new work anniversary, nomination). A provincial nomination (+600) or hitting a work-experience anniversary recalculates your score automatically. Watch category-based draws — French ability or an in-demand occupation can invite you at far lower scores than general rounds.",
    link: sources.categoryBased,
  },
  {
    title: "After the ITA: the 60-day sprint",
    body: `An invitation starts a 60-day clock to submit a complete application: police certificates from every country you've lived in 6+ months since age 18 (start early — some take months; you can decline the ITA and re-enter the pool if you're not ready), upfront medical exam, employment reference letters on company letterhead listing duties/hours/salary, proof of funds, and fees ($${fees.eePrincipalProcessing} + $${fees.eeRightOfPermanentResidence} per adult).`,
    link: sources.drawRounds,
  },
  {
    title: "Processing to landing",
    body: "IRCC's service standard is 6 months from a complete application; reality varies. You'll do biometrics, then wait. After approval you get a COPR — landing (or the in-Canada confirmation portal) makes you a permanent resident. Your citizenship clock starts the day you land, with half-credit for time already spent in Canada before PR.",
    link: sources.processingTimes,
  },
];

const mistakes = [
  "Reference letters that don't list duties matching your NOC code's lead statement",
  "Police certificate ordered too late for a country with slow issuance",
  "Funds dipping below the threshold mid-process (must be maintained until visa issuance)",
  "Claiming full-time work that overlaps with full-time study (doesn't count for CEC)",
  "Letting the language test expire between profile creation and ITA",
];

export default function ExpressEntryGuide() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-maple">Guide</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">
        The Express Entry profile, step by step
      </h1>
      <p className="mt-3 text-soft">
        From zero documents to permanent residence under FSW, CEC or FST. Use
        the <Link href="/plan" className="text-maple underline underline-offset-2">planner</Link>{" "}
        first to confirm which program fits and how your score compares to
        recent cutoffs. <span className="text-xs">(English only for now.)</span>
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-bold">The six steps</h2>
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
        <h2 className="text-xl font-bold">The five mistakes that sink applications</h2>
        <ul className="mt-4 space-y-2">
          {mistakes.map((m) => (
            <li key={m} className="flex items-start gap-2 text-sm">
              <span className="text-maple">✗</span>
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
        Draw patterns shift constantly — recent rounds have favoured the
        Canadian Experience Class, provincial nominees, French speakers and
        category occupations. Check the live cutoffs on our{" "}
        <Link href="/updates" className="font-semibold underline underline-offset-2">
          updates page
        </Link>{" "}
        before banking on a general draw.
      </section>

      <p className="mt-8">
        <Link href="/plan" className="font-semibold text-maple underline underline-offset-2">
          ← Back to your roadmap
        </Link>
      </p>
    </div>
  );
}
