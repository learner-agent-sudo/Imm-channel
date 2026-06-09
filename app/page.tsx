import Link from "next/link";

const steps = [
  {
    title: "Answer 5 minutes of anonymous questions",
    body: "Age, education, language, work experience, funds. No name, no email, no documents — everything stays in your browser.",
  },
  {
    title: "Get ranked pathways, not a yes/no",
    body: "Express Entry, PNP, study-to-PR, or work-permit-first — each with a step-by-step timeline, costs, and your score versus recent draw cutoffs.",
  },
  {
    title: "Follow the road all the way to citizenship",
    body: "Every plan ends at the oath, not at the visa: PR landing, the 1,095-day presence rule, and a realistic citizenship date.",
  },
];

const comparison = [
  {
    them: "Tells you whether you're eligible today",
    us: "Plans the multi-year sequence when you're not eligible yet",
  },
  {
    them: "One program at a time, in bureaucratic language",
    us: "All pathways ranked side-by-side, in plain language",
  },
  {
    them: "You re-check the rules after every announcement",
    us: "We monitor IRCC announcements and draws, and keep the rules current",
  },
  {
    them: "Stops at permanent residence",
    us: "Maps the full road to citizenship, including the presence credit",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-20 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-maple">
          Canada immigration, planned end-to-end
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Your personal roadmap from where you are now to Canadian citizenship
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-soft">
          IRCC&apos;s tools tell you if you qualify <em>today</em>. Most people
          don&apos;t — yet. Imm Channel builds the multi-year plan: which
          pathway, in what order, how long, how much, and what single change
          would boost your score the most.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/plan"
            className="rounded-lg bg-maple px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-maple-dark"
          >
            Build my roadmap →
          </Link>
          <Link
            href="/updates"
            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-ink transition hover:bg-slate-50"
          >
            Latest IRCC changes
          </Link>
        </div>
        <p className="mt-4 text-xs text-soft">
          Free · anonymous · nothing leaves your browser
        </p>
      </section>

      <section className="grid gap-6 py-10 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-xl border border-slate-200 p-6">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-maple text-sm font-bold text-white">
              {i + 1}
            </div>
            <h2 className="font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-soft">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="py-14">
        <h2 className="text-center text-2xl font-bold">
          Why not just use the IRCC website?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-soft">
          You should — for applying. canada.ca is the only official source, and
          we link to it at every step. This site does the part IRCC
          doesn&apos;t: strategy.
        </p>
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-5 py-3 font-semibold text-soft">
                  IRCC&apos;s “Come to Canada” tool
                </th>
                <th className="px-5 py-3 font-semibold text-maple">
                  Imm Channel
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.us} className="border-t border-slate-200">
                  <td className="px-5 py-4 text-soft">{row.them}</td>
                  <td className="px-5 py-4 font-medium">{row.us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900 px-8 py-12 text-center text-white">
        <h2 className="text-2xl font-bold">
          The rules changed seven times in the last two years.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Job-offer points: gone. PGWP language minimums: new. Study-permit
          funds: raised. Our policy monitor watches IRCC announcements and
          Express Entry draws so your plan reflects this month&apos;s rules —
          not last year&apos;s blog posts.
        </p>
        <Link
          href="/updates"
          className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-200"
        >
          See what changed
        </Link>
      </section>
    </div>
  );
}
