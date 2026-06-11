"use client";

import Link from "next/link";
import type { GuideContent } from "@/lib/guides/types";
import type { Locale } from "@/lib/i18n";
import { useT } from "@/components/locale-provider";

/** Renders a fully localized guide, following the site language switcher. */
export default function GuideView({ content }: { content: Record<Locale, GuideContent> }) {
  const { t, locale } = useT();
  const c = content[locale];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-maple">{c.kicker}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{c.title}</h1>
      <p className="mt-3 text-soft">{c.intro}</p>

      <div className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm sm:grid-cols-3">
        {c.facts.map((f) => (
          <div key={f.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-soft">{f.label}</p>
            <p className="mt-0.5 font-semibold">{f.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold">{c.stepsTitle}</h2>
        <ol className="mt-4 space-y-0">
          {c.steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 pb-7 last:pb-0">
              {i < c.steps.length - 1 && (
                <span className="absolute left-[11px] top-7 h-full w-px bg-slate-200" />
              )}
              <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-soft">{s.body}</p>
                <a
                  href={s.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-medium text-maple underline underline-offset-2"
                >
                  {t("res.official")}
                </a>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {c.checklist && c.checklistTitle && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">{c.checklistTitle}</h2>
          <ul className="mt-4 space-y-2">
            {c.checklist.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <span className="text-maple">☐</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {c.boxes && c.boxesTitle && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">{c.boxesTitle}</h2>
          {c.boxesIntro && <p className="mt-1 text-sm text-soft">{c.boxesIntro}</p>}
          <div className="mt-4 space-y-4">
            {c.boxes.map((b) => (
              <div key={b.title} className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold">{b.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-soft">{b.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {c.mistakes && c.mistakesTitle && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">{c.mistakesTitle}</h2>
          <ul className="mt-4 space-y-2">
            {c.mistakes.map((m) => (
              <li key={m} className="flex items-start gap-2 text-sm">
                <span className="text-maple">✗</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
        {c.warning.pre}
        <Link href="/updates" className="font-semibold underline underline-offset-2">
          {c.warning.linkText}
        </Link>
        {c.warning.post}
      </section>

      <p className="mt-8">
        <Link href="/plan" className="font-semibold text-maple underline underline-offset-2">
          {c.back}
        </Link>
      </p>
    </div>
  );
}
