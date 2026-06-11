/**
 * Shared shape for fully-localized guide content. Each guide module exports
 * a Record<Locale, GuideContent>; the GuideView client component picks the
 * active locale's content. Numeric values come from lib/rules/parameters so
 * every locale stays consistent with the rules data.
 */

export interface GuideStep {
  title: string;
  body: string;
  linkUrl: string;
}

export interface GuideBox {
  title: string;
  detail: string;
}

export interface GuideContent {
  kicker: string;
  title: string;
  intro: string;
  facts: { label: string; value: string }[];
  stepsTitle: string;
  steps: GuideStep[];
  checklistTitle?: string;
  checklist?: string[];
  boxesTitle?: string;
  boxesIntro?: string;
  boxes?: GuideBox[];
  mistakesTitle?: string;
  mistakes?: string[];
  warning: { pre: string; linkText: string; post: string };
  back: string;
}
