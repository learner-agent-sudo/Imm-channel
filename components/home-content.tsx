"use client";

import Link from "next/link";
import { useT } from "@/components/locale-provider";
import type { DictKey } from "@/lib/i18n";

const stepKeys: [DictKey, DictKey][] = [
  ["home.step1.title", "home.step1.body"],
  ["home.step2.title", "home.step2.body"],
  ["home.step3.title", "home.step3.body"],
];

const comparisonKeys: [DictKey, DictKey][] = [
  ["home.them1", "home.us1"],
  ["home.them2", "home.us2"],
  ["home.them3", "home.us3"],
  ["home.them4", "home.us4"],
];

export default function HomeContent() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-20 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-maple">
          {t("home.kicker")}
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          {t("home.h1")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-soft">{t("home.sub")}</p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/plan"
            className="rounded-lg bg-maple px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-maple-dark"
          >
            {t("home.ctaPlan")}
          </Link>
          <Link
            href="/updates"
            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-ink transition hover:bg-slate-50"
          >
            {t("home.ctaUpdates")}
          </Link>
        </div>
        <p className="mt-4 text-xs text-soft">{t("home.free")}</p>
      </section>

      <section className="grid gap-6 py-10 sm:grid-cols-3">
        {stepKeys.map(([title, body], i) => (
          <div key={title} className="rounded-xl border border-slate-200 p-6">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-maple text-sm font-bold text-white">
              {i + 1}
            </div>
            <h2 className="font-semibold">{t(title)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-soft">{t(body)}</p>
          </div>
        ))}
      </section>

      <section className="py-14">
        <h2 className="text-center text-2xl font-bold">{t("home.whyTitle")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-soft">{t("home.whySub")}</p>
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-5 py-3 font-semibold text-soft">{t("home.colIrcc")}</th>
                <th className="px-5 py-3 font-semibold text-maple">{t("home.colUs")}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonKeys.map(([them, us]) => (
                <tr key={them} className="border-t border-slate-200">
                  <td className="px-5 py-4 text-soft">{t(them)}</td>
                  <td className="px-5 py-4 font-medium">{t(us)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900 px-8 py-12 text-center text-white">
        <h2 className="text-2xl font-bold">{t("home.bannerTitle")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">{t("home.bannerBody")}</p>
        <Link
          href="/updates"
          className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-200"
        >
          {t("home.bannerCta")}
        </Link>
      </section>
    </div>
  );
}
