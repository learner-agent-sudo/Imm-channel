import { en, type Dict } from "@/lib/i18n/en";
import { fr } from "@/lib/i18n/fr";
import { zhHant } from "@/lib/i18n/zh-hant";
import { zhHans } from "@/lib/i18n/zh-hans";

export type Locale = "en" | "fr" | "zh-Hant" | "zh-Hans";
export type DictKey = keyof typeof en;

export const dictionaries: Record<Locale, Dict> = {
  en,
  fr,
  "zh-Hant": zhHant,
  "zh-Hans": zhHans,
};

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  "zh-Hant": "繁體中文",
  "zh-Hans": "简体中文",
};

/** Best-guess locale from a browser language tag. */
export function detectLocale(tag: string): Locale {
  const t = tag.toLowerCase();
  if (t.startsWith("fr")) return "fr";
  if (t.startsWith("zh")) {
    return t.includes("hans") || t.includes("cn") || t.includes("sg") ? "zh-Hans" : "zh-Hant";
  }
  return "en";
}

export function translate(locale: Locale, key: DictKey, vars?: Record<string, string | number>): string {
  let text: string = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
