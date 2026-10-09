"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { detectLocale, translate, type DictKey, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "imm-locale";

// Storage throws when the visitor blocks site data (e.g. Chrome's "block all
// cookies"); the language choice then just isn't remembered.
function readSavedLocale(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveLocale(l: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, l);
  } catch {
    // Keep the in-memory choice for this visit.
  }
}

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
      const saved = readSavedLocale();
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
    saveLocale(l);
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
