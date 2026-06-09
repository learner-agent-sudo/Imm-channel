"use client";

import type {
  DrawsData,
  PathwayPlan,
  PlannerResult,
  RequirementCheck,
} from "@/lib/types";
import { FSW_PASS_MARK } from "@/lib/fsw";
import { disclaimer } from "@/lib/rules/parameters";

/* ------------------------------ Formatting ------------------------------ */

function months(min: number, max: number): string {
  if (max >= 20) {
    const f = (n: number) => {
      const y = n / 12;
      return Number.isInteger(y) ? `${y}` : y.toFixed(1);
    };
    return `${f(min)}–${f(max)} years`;
  }
  return `${min}–${max} months`;
}

function money(min: number, max: number): string {
  const f = (n: number) => `$${Math.round(n).toLocaleString()}`;
  return `${f(min)} – ${f(max)} CAD`;
}

const STATUS_STYLE: Record<PathwayPlan["status"], { label: string; cls: string }> = {
  ready: { label: "Competitive now", cls: "bg-green-100 text-green-800" },
  "action-needed": { label: "Possible with action", cls: "bg-amber-100 text-amber-800" },
  "long-term": { label: "Long-term route", cls: "bg-blue-100 text-blue-800" },
  "not-viable": { label: "Not viable", cls: "bg-slate-100 text-slate-600" },
};

function Check({ check }: { check: RequirementCheck }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span className={check.met ? "text-green-600" : "text-maple"}>
        {check.met ? "✓" : "✗"}
      </span>
      <span>
        <span className={check.met ? "" : "font-medium"}>{check.label}</span>
        {check.detail && <span className="block text-xs text-soft">{check.detail}</span>}
      </span>
    </li>
  );
}

/* ------------------------------- Sections ------------------------------- */

function ScoreCard({ result }: { result: PlannerResult }) {
  const { crs } = result;
  const rows: [string, number][] = [
    ["Age", crs.coreHumanCapital.age],
    ["Education", crs.coreHumanCapital.education],
    ["First official language", crs.coreHumanCapital.firstLanguage],
    ["Second official language", crs.coreHumanCapital.secondLanguage],
    ["Canadian work experience", crs.coreHumanCapital.canadianWork],
    ["Spouse factors", crs.spouseFactors.subtotal],
    ["Skill transferability", crs.skillTransferability.subtotal],
    ["Canadian study bonus", crs.additional.canadianStudy],
    ["French bonus", crs.additional.french],
    ["Sibling in Canada", crs.additional.sibling],
  ];
  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-soft">Your Comprehensive Ranking System score</p>
          <p className="text-5xl font-bold tracking-tight">{crs.total}</p>
        </div>
        <div className="text-right text-sm text-soft">
          <p>
            FSW selection grid:{" "}
            <span className={result.fswGridPoints >= FSW_PASS_MARK ? "font-semibold text-green-700" : "font-semibold text-maple"}>
              {result.fswGridPoints}/100
            </span>{" "}
            (pass mark {FSW_PASS_MARK})
          </p>
          <p className="mt-1">
            Pool programs:{" "}
            {result.programs.map((p) => (
              <span
                key={p.programId}
                className={`ml-1 inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${
                  p.eligible ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"
                }`}
              >
                {p.programId.toUpperCase()} {p.eligible ? "✓" : "✗"}
              </span>
            ))}
          </p>
        </div>
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-maple">
          How your {crs.total} points break down
        </summary>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {rows.map(([label, pts]) => (
              <tr key={label} className="border-t border-slate-100">
                <td className="py-1.5 text-soft">{label}</td>
                <td className="py-1.5 text-right font-medium">{pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function ProgramChecks({ result }: { result: PlannerResult }) {
  return (
    <details className="rounded-xl border border-slate-200 p-6">
      <summary className="cursor-pointer font-semibold">
        Express Entry program requirements — the detail
      </summary>
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        {result.programs.map((p) => (
          <div key={p.programId}>
            <h3 className="mb-2 text-sm font-semibold">
              {p.programName}{" "}
              <span className={p.eligible ? "text-green-600" : "text-maple"}>
                {p.eligible ? "— eligible" : "— not yet"}
              </span>
            </h3>
            <ul className="space-y-2">
              {p.checks.map((c) => (
                <Check key={c.label} check={c} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}

function DrawTable({ pathway }: { pathway: PathwayPlan }) {
  if (!pathway.drawComparison || pathway.drawComparison.length === 0) return null;
  const badge = {
    above: "bg-green-100 text-green-800",
    close: "bg-amber-100 text-amber-800",
    below: "bg-red-50 text-maple",
  } as const;
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-soft">
          <tr>
            <th className="px-4 py-2">Draw stream</th>
            <th className="px-4 py-2">Recent cutoff</th>
            <th className="px-4 py-2">You</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {pathway.drawComparison.map((d) => (
            <tr key={d.stream} className="border-t border-slate-100">
              <td className="px-4 py-2">
                {d.stream}
                <span className="block text-xs text-soft">{d.drawDate}</span>
              </td>
              <td className="px-4 py-2 font-medium">{d.recentCutoff}</td>
              <td className="px-4 py-2 font-medium">{d.userScore}</td>
              <td className="px-4 py-2">
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${badge[d.competitive]}`}>
                  {d.competitive === "above" ? "Above cutoff" : d.competitive === "close" ? "Close" : "Below"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PathwayCard({ pathway, index }: { pathway: PathwayPlan; index: number }) {
  const status = STATUS_STYLE[pathway.status];
  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-soft">
            Option {index + 1}
          </p>
          <h3 className="mt-1 text-xl font-bold">{pathway.title}</h3>
          <p className="mt-1 text-sm text-soft">{pathway.tagline}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-5 grid gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-soft">Time to PR</p>
          <p className="mt-0.5 font-semibold">{months(pathway.monthsToPRMin, pathway.monthsToPRMax)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-soft">Time to citizenship</p>
          <p className="mt-0.5 font-semibold">
            {months(pathway.monthsToCitizenshipMin, pathway.monthsToCitizenshipMax)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-soft">Estimated cost</p>
          <p className="mt-0.5 font-semibold">{money(pathway.estCostMinCAD, pathway.estCostMaxCAD)}</p>
        </div>
      </div>

      {pathway.projectedCrs && (
        <p className="mt-3 text-sm">
          Projected score on this route:{" "}
          <span className="font-bold text-maple">~{pathway.projectedCrs}</span>
          {pathway.crs !== undefined && <span className="text-soft"> (now: {pathway.crs})</span>}
        </p>
      )}

      <DrawTable pathway={pathway} />

      <details className="mt-4" open={index === 0}>
        <summary className="cursor-pointer text-sm font-semibold text-maple">
          Step-by-step plan
        </summary>
        <ol className="mt-4 space-y-0">
          {pathway.steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
              {i < pathway.steps.length - 1 && (
                <span className="absolute left-[11px] top-7 h-full w-px bg-slate-200" />
              )}
              <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {s.title}
                  <span className="ml-2 font-normal text-soft">
                    {s.monthsMax > 0 && `· ${months(s.monthsMin, s.monthsMax)}`}
                  </span>
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-soft">{s.detail}</p>
                {s.officialLink && (
                  <a
                    href={s.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-medium text-maple underline underline-offset-2"
                  >
                    Official IRCC page ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </details>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-soft">
          Requirements & caveats
        </summary>
        <ul className="mt-3 space-y-2">
          {pathway.requirements.map((c) => (
            <Check key={c.label} check={c} />
          ))}
        </ul>
        {pathway.caveats.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-soft">
            {pathway.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}

function Boosters({ result }: { result: PlannerResult }) {
  if (result.boosters.length === 0) return null;
  return (
    <section>
      <h2 className="text-xl font-bold">Fastest ways to raise your score</h2>
      <p className="mt-1 text-sm text-soft">
        Recomputed from your actual profile — not generic advice.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {result.boosters.map((b) => (
          <div key={b.label} className="rounded-xl border border-slate-200 p-5">
            <p className="text-2xl font-bold text-green-700">+{b.delta}</p>
            <p className="mt-1 font-semibold">{b.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-soft">{b.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- Results -------------------------------- */

export default function Results({
  result,
  draws,
  onRestart,
}: {
  result: PlannerResult;
  draws: DrawsData;
  onRestart: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
        {disclaimer}
      </div>

      <ScoreCard result={result} />
      <ProgramChecks result={result} />

      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">Your pathways, ranked</h2>
          <p className="text-xs text-soft">
            Draw data: {draws.source === "live" ? "live from IRCC" : "snapshot"} · {draws.asOf}
          </p>
        </div>
        <div className="mt-4 space-y-6">
          {result.pathways.map((p, i) => (
            <PathwayCard key={p.id} pathway={p} index={i} />
          ))}
        </div>
      </section>

      <Boosters result={result} />

      <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50"
        >
          ← Change my answers
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50"
        >
          Save as PDF
        </button>
      </div>
    </div>
  );
}
