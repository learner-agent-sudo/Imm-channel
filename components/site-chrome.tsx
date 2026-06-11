"use client";

import Link from "next/link";
import { useT } from "@/components/locale-provider";
import { localeNames, type Locale } from "@/lib/i18n";

export function SiteHeader() {
  const { t, locale, setLocale } = useT();
  return (
    <header className="border-b border-slate-200">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="text-maple">🍁</span> Imm Channel
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium text-soft">
          <Link href="/plan" className="hover:text-ink">
            {t("nav.plan")}
          </Link>
          <Link href="/updates" className="hover:text-ink">
            {t("nav.updates")}
          </Link>
          <Link href="/methodology" className="hidden hover:text-ink sm:inline">
            {t("nav.methodology")}
          </Link>
          <select
            aria-label={t("lang.label")}
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium focus:border-maple focus:outline-none"
          >
            {(Object.keys(localeNames) as Locale[]).map((l) => (
              <option key={l} value={l}>
                {localeNames[l]}
              </option>
            ))}
          </select>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 text-xs leading-relaxed text-soft">
        <p className="font-semibold text-ink">{t("footer.title")}</p>
        <p>{t("footer.disclaimer")}</p>
        <p>{t("footer.privacy")}</p>
      </div>
    </footer>
  );
}
