"use client";

import Link from "next/link";
import { useT } from "@/components/locale-provider";

export default function NotFoundContent() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-maple">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{t("notFound.title")}</h1>
      <p className="mt-4 text-soft">{t("notFound.body")}</p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-lg bg-maple px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-maple-dark"
      >
        {t("notFound.home")}
      </Link>
    </div>
  );
}
