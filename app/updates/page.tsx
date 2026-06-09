import type { Metadata } from "next";
import { getDraws } from "@/lib/draws";
import policyUpdates from "@/data/policy-updates.json";

export const metadata: Metadata = {
  title: "IRCC policy updates — Imm Channel",
};

// Re-render periodically so live draw data stays fresh in production.
export const revalidate = 21600;

export default async function UpdatesPage() {
  const draws = await getDraws();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">What changed at IRCC</h1>
      <p className="mt-2 text-soft">
        Our monitor watches IRCC announcements and Express Entry rounds. Every
        change below has been verified against the official source before we
        updated the planner&apos;s rules.
      </p>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">Recent Express Entry draws</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              draws.source === "live"
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {draws.source === "live" ? "Live from IRCC" : `Snapshot · ${draws.asOf}`}
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-soft">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Stream</th>
                <th className="px-4 py-2.5 text-right">Invitations</th>
                <th className="px-4 py-2.5 text-right">CRS cutoff</th>
              </tr>
            </thead>
            <tbody>
              {draws.rounds.slice(0, 12).map((r) => (
                <tr key={r.drawNumber} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 whitespace-nowrap text-soft">{r.date}</td>
                  <td className="px-4 py-2.5">{r.stream}</td>
                  <td className="px-4 py-2.5 text-right">{r.invitations.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{r.cutoff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-soft">
          Source:{" "}
          <a
            className="underline underline-offset-2"
            href="https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            IRCC rounds of invitations
          </a>
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Policy changes affecting your plan</h2>
        <ol className="mt-4 space-y-0">
          {policyUpdates.updates.map((u, i) => (
            <li key={u.title} className="relative flex gap-4 pb-8 last:pb-0">
              {i < policyUpdates.updates.length - 1 && (
                <span className="absolute left-[5px] top-4 h-full w-px bg-slate-200" />
              )}
              <span className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-maple" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-soft">
                  {u.date}
                </p>
                <h3 className="mt-0.5 font-semibold">{u.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-soft">{u.summary}</p>
                <p className="mt-2 flex flex-wrap items-center gap-2">
                  {u.affects.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-soft"
                    >
                      {tag}
                    </span>
                  ))}
                  <a
                    href={u.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-maple underline underline-offset-2"
                  >
                    Official source ↗
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
