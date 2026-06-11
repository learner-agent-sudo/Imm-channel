"use client";

import Link from "next/link";
import type {
  DrawsData,
  PathwayPlan,
  PlannerResult,
  RequirementCheck,
  SpecialNotice,
} from "@/lib/types";
import { FSW_PASS_MARK } from "@/lib/fsw";
import { useT } from "@/components/locale-provider";
import type { DictKey } from "@/lib/i18n";

/* ------------------------------ Formatting ------------------------------ */

type T = (key: DictKey, vars?: Record<string, string | number>) => string;

function months(t: T, min: number, max: number): string {
  if (max >= 20) {
    const f = (n: number) => {
      const y = n / 12;
      return Number.isInteger(y) ? `${y}` : y.toFixed(1);
    };
    return `${f(min)}–${f(max)} ${t("unit.years")}`;
  }
  return `${min}–${max} ${t("unit.months")}`;
}

function money(min: number, max: number): string {
  const f = (n: number) => `$${Math.round(n).toLocaleString()}`;
  return `${f(min)} – ${f(max)} CAD`;
}

const STATUS_KEYS: Record<PathwayPlan["status"], { key: DictKey; cls: string }> = {
  ready: { key: "status.ready", cls: "bg-green-100 text-green-800" },
  "action-needed": { key: "status.action", cls: "bg-amber-100 text-amber-800" },
  "long-term": { key: "status.longterm", cls: "bg-blue-100 text-blue-800" },
  "not-viable": { key: "status.notviable", cls: "bg-slate-100 text-slate-600" },
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
  const { t } = useT();
  const { crs } = result;
  const rows: [DictKey, number][] = [
    ["res.row.age", crs.coreHumanCapital.age],
    ["res.row.education", crs.coreHumanCapital.education],
    ["res.row.lang1", crs.coreHumanCapital.firstLanguage],
    ["res.row.lang2", crs.coreHumanCapital.secondLanguage],
    ["res.row.cdnWork", crs.coreHumanCapital.canadianWork],
    ["res.row.spouse", crs.spouseFactors.subtotal],
    ["res.row.transfer", crs.skillTransferability.subtotal],
    ["res.row.study", crs.additional.canadianStudy],
    ["res.row.french", crs.additional.french],
    ["res.row.sibling", crs.additional.sibling],
  ];
  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-soft">{t("res.crsTitle")}</p>
          <p className="text-5xl font-bold tracking-tight">{crs.total}</p>
        </div>
        <div className="text-right text-sm text-soft">
          <p>
            {t("res.fswGrid")}{" "}
            <span
              className={
                result.fswGridPoints >= FSW_PASS_MARK
                  ? "font-semibold text-green-700"
                  : "font-semibold text-maple"
              }
            >
              {result.fswGridPoints}/100
            </span>{" "}
            {t("res.passMark", { n: FSW_PASS_MARK })}
          </p>
          <p className="mt-1">
            {t("res.pool")}{" "}
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
          {t("res.breakdown", { n: crs.total })}
        </summary>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {rows.map(([key, pts]) => (
              <tr key={key} className="border-t border-slate-100">
                <td className="py-1.5 text-soft">{t(key)}</td>
                <td className="py-1.5 text-right font-medium">{pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function NextMove({ pathway }: { pathway: PathwayPlan }) {
  const { t } = useT();
  const firstSteps = pathway.steps.slice(0, 3);
  // Cumulative start month of each step (step i starts after steps 0..i-1).
  const offsets = firstSteps.map((_, i) =>
    firstSteps.slice(0, i).reduce((sum, x) => sum + x.monthsMin, 0),
  );
  return (
    <div className="rounded-xl border-2 border-maple bg-red-50/40 p-6">
      <h2 className="text-xl font-bold">{t("res.next.title")}</h2>
      <p className="mt-1 text-sm text-soft">
        {t("res.next.sub")} — {pathway.title}
      </p>
      <ol className="mt-4 space-y-3">
        {firstSteps.map((s, i) => {
          const label =
            offsets[i] === 0 ? t("res.next.now") : t("res.next.month", { n: offsets[i] });
          return (
            <li key={s.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-maple text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {s.title}
                  <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-xs font-medium text-soft">
                    {label}
                  </span>
                </p>
                {s.guide && (
                  <Link
                    href={s.guide}
                    className="mt-0.5 inline-block text-xs font-semibold text-maple underline underline-offset-2"
                  >
                    {t("res.guide")}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ProgramChecks({ result }: { result: PlannerResult }) {
  const { t } = useT();
  return (
    <details className="rounded-xl border border-slate-200 p-6">
      <summary className="cursor-pointer font-semibold">{t("res.programsTitle")}</summary>
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        {result.programs.map((p) => (
          <div key={p.programId}>
            <h3 className="mb-2 text-sm font-semibold">
              {p.programName}{" "}
              <span className={p.eligible ? "text-green-600" : "text-maple"}>
                {p.eligible ? t("res.eligible") : t("res.notYet")}
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
  const { t } = useT();
  if (!pathway.drawComparison || pathway.drawComparison.length === 0) return null;
  const badge = {
    above: { key: "res.badge.above" as DictKey, cls: "bg-green-100 text-green-800" },
    close: { key: "res.badge.close" as DictKey, cls: "bg-amber-100 text-amber-800" },
    below: { key: "res.badge.below" as DictKey, cls: "bg-red-50 text-maple" },
  };
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-soft">
          <tr>
            <th className="px-4 py-2">{t("res.draw.stream")}</th>
            <th className="px-4 py-2">{t("res.draw.cutoff")}</th>
            <th className="px-4 py-2">{t("res.draw.you")}</th>
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
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${badge[d.competitive].cls}`}
                >
                  {t(badge[d.competitive].key)}
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
  const { t } = useT();
  const status = STATUS_KEYS[pathway.status];
  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-soft">
            {t("res.option", { n: index + 1 })}
          </p>
          <h3 className="mt-1 text-xl font-bold">{pathway.title}</h3>
          <p className="mt-1 text-sm text-soft">{pathway.tagline}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}>
          {t(status.key)}
        </span>
      </div>

      <div className="mt-5 grid gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-soft">{t("res.timePR")}</p>
          <p className="mt-0.5 font-semibold">
            {months(t, pathway.monthsToPRMin, pathway.monthsToPRMax)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-soft">{t("res.timeCit")}</p>
          <p className="mt-0.5 font-semibold">
            {months(t, pathway.monthsToCitizenshipMin, pathway.monthsToCitizenshipMax)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-soft">{t("res.cost")}</p>
          <p className="mt-0.5 font-semibold">{money(pathway.estCostMinCAD, pathway.estCostMaxCAD)}</p>
        </div>
      </div>

      {pathway.projectedCrs && (
        <p className="mt-3 text-sm">
          {t("res.projected")}{" "}
          <span className="font-bold text-maple">~{pathway.projectedCrs}</span>
          {pathway.crs !== undefined && (
            <span className="text-soft"> {t("res.nowScore", { n: pathway.crs })}</span>
          )}
        </p>
      )}

      <DrawTable pathway={pathway} />

      <details className="mt-4" open={index === 0}>
        <summary className="cursor-pointer text-sm font-semibold text-maple">
          {t("res.steps")}
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
                    {s.monthsMax > 0 && `· ${months(t, s.monthsMin, s.monthsMax)}`}
                  </span>
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-soft">{s.detail}</p>
                <p className="mt-1 flex flex-wrap gap-3">
                  {s.guide && (
                    <Link
                      href={s.guide}
                      className="inline-block text-xs font-semibold text-maple underline underline-offset-2"
                    >
                      {t("res.guide")}
                    </Link>
                  )}
                  {s.officialLink && (
                    <a
                      href={s.officialLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-medium text-soft underline underline-offset-2"
                    >
                      {t("res.official")}
                    </a>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </details>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-soft">{t("res.reqs")}</summary>
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

function Notices({ notices }: { notices: SpecialNotice[] }) {
  const { t } = useT();
  if (notices.length === 0) return null;
  const statusStyle = {
    open: { key: "notice.open" as DictKey, cls: "bg-green-100 text-green-800" },
    closed: { key: "notice.closed" as DictKey, cls: "bg-slate-200 text-slate-700" },
    check: { key: "notice.check" as DictKey, cls: "bg-amber-100 text-amber-800" },
  };
  return (
    <section>
      <h2 className="text-xl font-bold">{t("res.notices")}</h2>
      <div className="mt-4 space-y-4">
        {notices.map((n) => (
          <div key={n.id} className="rounded-xl border border-slate-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-semibold">{n.title}</h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[n.status].cls}`}
              >
                {t(statusStyle[n.status].key)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-soft">{n.summary}</p>
            <a
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-medium text-maple underline underline-offset-2"
            >
              {t("res.official")}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function Boosters({ result }: { result: PlannerResult }) {
  const { t } = useT();
  if (result.boosters.length === 0) return null;
  return (
    <section>
      <h2 className="text-xl font-bold">{t("res.boostTitle")}</h2>
      <p className="mt-1 text-sm text-soft">{t("res.boostSub")}</p>
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
  const { t, locale } = useT();
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
        {t("footer.disclaimer")}
        {locale !== "en" && <span className="mt-1 block font-medium">{t("res.engNote")}</span>}
      </div>

      <ScoreCard result={result} />
      {result.pathways.length > 0 && <NextMove pathway={result.pathways[0]} />}
      <ProgramChecks result={result} />

      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">{t("res.pathways")}</h2>
          <p className="text-xs text-soft">
            {draws.source === "live" ? t("res.drawLive") : t("res.drawSnapshot")} · {draws.asOf}
          </p>
        </div>
        <div className="mt-4 space-y-6">
          {result.pathways.map((p, i) => (
            <PathwayCard key={p.id} pathway={p} index={i} />
          ))}
        </div>
      </section>

      <Notices notices={result.notices} />
      <Boosters result={result} />

      <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50"
        >
          {t("res.change")}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50"
        >
          {t("res.pdf")}
        </button>
      </div>
    </div>
  );
}
