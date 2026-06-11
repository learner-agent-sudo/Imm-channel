"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { detectLocale, translate, type DictKey, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "imm-locale";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
}>({ locale: "en", setLocale: () => {} });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // SSR renders English; the saved/browser preference applies after mount.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    // Client-only preference hydration: SSR always renders English, then the
    // saved/browser locale applies after mount. The async dispatch keeps the
    // initial hydration pass clean (and satisfies set-state-in-effect).
    const timer = setTimeout(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "fr" || saved === "zh-Hant" || saved === "zh-Hans") {
        setLocaleState(saved);
      } else if (typeof navigator !== "undefined") {
        setLocaleState(detectLocale(navigator.language));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

/** Translation hook: `const { t, locale, setLocale } = useT()`. */
export function useT() {
  const { locale, setLocale } = useContext(LocaleContext);
  const t = (key: DictKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
  return { t, locale, setLocale };
}
