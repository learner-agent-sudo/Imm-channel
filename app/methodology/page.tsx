import type { Metadata } from "next";
import { disclaimer, RULES_VERSION, sources } from "@/lib/rules/parameters";

export const metadata: Metadata = {
  title: "Methodology & data sources — Imm Channel",
};

const limitations = [
  "Quebec runs its own economic immigration system (Arrima / CSQ). This planner covers federal programs and only mentions the PNP at a high level.",
  "Family sponsorship, refugee and humanitarian streams are out of scope for this MVP.",
  "Draw cutoffs move every round. A comparison against recent draws is a signal, not a guarantee of invitation.",
  "Work-experience rules have nuances (continuity, full-time equivalence, authorization, self-employment exclusions) that a questionnaire can't fully capture.",
  "Proof-of-funds and fee amounts change at least annually — always confirm the exact figure on the linked IRCC page before relying on it.",
  "Admissibility (medical, criminal, misrepresentation) is assumed and not assessed here.",
];

export default function MethodologyPage() {
  const entries = Object.values(sources);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">How this site works</h1>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-soft">
        <p>
          <strong className="text-ink">The planner is a rules engine, not an AI guess.</strong>{" "}
          Eligibility checks, the CRS calculator and the FSW selection grid are
          coded directly from IRCC&apos;s published criteria, with unit tests
          against hand-verified scoring examples. Every parameter (fees, funds
          thresholds, processing times) lives in a versioned rules file —
          currently <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">v{RULES_VERSION}</code> —
          with the source URL and the date we last verified it.
        </p>
        <p>
          <strong className="text-ink">Policy changes are monitored, then applied by a human.</strong>{" "}
          An automated job watches IRCC news releases and the official Express
          Entry rounds feed. When something changes, it opens a review task; we
          verify the change against the official text before updating the rules
          and the <a href="/updates" className="text-maple underline underline-offset-2">updates feed</a>.
          Draw cutoffs are the exception: they come straight from IRCC&apos;s
          published JSON and refresh automatically.
        </p>
        <p>
          <strong className="text-ink">Privacy by architecture.</strong> The
          questionnaire and all scoring run in your browser. We don&apos;t ask
          for your name or email, there are no accounts, and your answers are
          never transmitted or stored. The only network request the planner
          makes is for public draw statistics.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Data sources</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-soft">
              <tr>
                <th className="px-4 py-2.5">Source</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Last verified</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((s) => (
                <tr key={s.url} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-maple underline underline-offset-2"
                    >
                      {s.label}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-soft">{s.lastVerified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Known limitations</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-soft">
          {limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
        {disclaimer}
      </section>
    </div>
  );
}
